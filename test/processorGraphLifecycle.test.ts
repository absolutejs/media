import { describe, expect, test } from 'bun:test';
import {
	buildMediaProcessorBranchReports,
	buildMediaProcessorFanInReport,
	createMediaFrame,
	createMediaProcessorBranchRouter,
	createMediaProcessorFanIn,
	createMediaProcessorGraph,
	parseMediaProcessorGraphSnapshot
} from '../src';

describe('processor graph lifecycle', () => {
	test('records lifecycle events and drains buffered processors', async () => {
		const frame = createMediaFrame({
			id: 'input-1',
			kind: 'input-audio',
			source: 'browser'
		});
		const buffered = createMediaFrame({
			id: 'buffered-1',
			kind: 'assistant-audio',
			source: 'voice-runtime'
		});
		const graph = createMediaProcessorGraph({
			name: 'lifecycle-test',
			nodes: [
				{
					name: 'passthrough',
					process: () => true
				},
				{
					flush: () => buffered,
					name: 'buffer',
					process: () => undefined
				}
			]
		});

		expect(graph.state()).toBe('idle');
		expect(await graph.process(frame)).toEqual([]);
		expect(graph.state()).toBe('idle');
		expect(await graph.drain()).toEqual([buffered]);

		const report = graph.report();
		expect(report.state).toBe('idle');
		expect(report.status).toBe('warn');
		expect(report.lifecycleEvents.map((event) => event.kind)).toEqual(
			expect.arrayContaining(['start', 'process', 'drain'])
		);
		expect(report.nodes.find((node) => node.name === 'buffer')?.droppedFrames).toBe(
			1
		);
	});

	test('reports graph edges, split outputs, labels, and terminal drops', async () => {
		const graph = createMediaProcessorGraph({
			name: 'edge-test',
			nodes: [
				{
					edgeLabel: 'split',
					name: 'splitter',
					process: (frame) => [
						{ ...frame, id: 'left-1' },
						{ ...frame, id: 'right-1' }
					]
				},
				{
					edgeLabel: (frame) =>
						frame.id.startsWith('left') ? 'keep' : 'drop',
					name: 'gate',
					process: (frame) =>
						frame.id.startsWith('left') ? frame : undefined
				}
			]
		});

		expect(
			await graph.process(
				createMediaFrame({
					id: 'input-1',
					kind: 'input-audio',
					source: 'browser'
				})
			)
		).toEqual([
			createMediaFrame({
				id: 'left-1',
				kind: 'input-audio',
				source: 'browser'
			})
		]);

		const report = graph.report();
		expect(graph.edgeEvents()).toHaveLength(4);
		expect(report.edges).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					emittedFrames: 2,
					from: 'splitter',
					label: 'split',
					outputFrames: ['left-1', 'right-1'],
					to: 'gate'
				}),
				expect.objectContaining({
					droppedFrames: 1,
					emittedFrames: 0,
					from: 'gate',
					label: 'drop',
					status: 'warn',
					to: 'output'
				}),
				expect.objectContaining({
					emittedFrames: 1,
					from: 'gate',
					label: 'keep',
					outputFrames: ['left-1'],
					to: 'output'
				})
			])
		);
		expect(report.status).toBe('warn');
	});

	test('routes frames through named media branches with branch reports', async () => {
		const graph = createMediaProcessorGraph({
			name: 'branch-router-test',
			nodes: [
				createMediaProcessorBranchRouter({
					name: 'router',
					routes: [
						{
							name: 'transcribe',
							process: (frame) => ({
								...frame,
								id: `${frame.id}-transcribe`
							}),
							when: (frame) => frame.kind === 'input-audio'
						},
						{
							name: 'record',
							process: (frame) => ({
								...frame,
								id: `${frame.id}-record`
							}),
							when: (frame) => frame.source === 'telephony'
						}
					]
				})
			]
		});

		const output = await graph.process(
			createMediaFrame({
				id: 'call-frame-1',
				kind: 'input-audio',
				source: 'telephony'
			})
		);

		expect(output.map((frame) => frame.id)).toEqual([
			'call-frame-1-transcribe',
			'call-frame-1-record'
		]);
		expect(output.map((frame) => frame.metadata?.mediaBranch)).toEqual([
			'transcribe',
			'record'
		]);

		const branchReports = buildMediaProcessorBranchReports({
			node: 'router',
			report: graph.report()
		});
		expect(branchReports).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					branch: 'transcribe',
					emittedFrames: 1,
					outputFrames: ['call-frame-1-transcribe'],
					status: 'pass'
				}),
				expect.objectContaining({
					branch: 'record',
					emittedFrames: 1,
					outputFrames: ['call-frame-1-record'],
					status: 'pass'
				})
			])
		);
	});

	test('fans branch outputs back into a complete joined frame', async () => {
		const graph = createMediaProcessorGraph({
			name: 'fan-in-test',
			nodes: [
				createMediaProcessorBranchRouter({
					name: 'router',
					routes: [
						{
							name: 'transcribe',
							process: (frame) => ({
								...frame,
								id: `${frame.id}-transcribe`
							})
						},
						{
							name: 'record',
							process: (frame) => ({
								...frame,
								id: `${frame.id}-record`
							})
						}
					]
				}),
				createMediaProcessorFanIn({
					expectedBranches: ['transcribe', 'record'],
					name: 'joiner'
				})
			]
		});

		const output = await graph.process(
			createMediaFrame({
				id: 'call-frame-1',
				kind: 'input-audio',
				source: 'telephony'
			})
		);

		expect(output).toHaveLength(1);
		expect(output[0]?.metadata?.mediaFanInStatus).toBe('complete');
		expect(output[0]?.metadata?.frameIds).toEqual([
			'call-frame-1-transcribe',
			'call-frame-1-record'
		]);

		const report = buildMediaProcessorFanInReport({
			node: 'joiner',
			report: graph.report()
		});
		expect(report).toEqual(
			expect.objectContaining({
				completeGroups: 1,
				emittedFrames: 1,
				partialGroups: 0,
				pendingGroups: 1,
				status: 'pass'
			})
		);
	});

	test('flushes pending fan-in groups as partial output', async () => {
		const graph = createMediaProcessorGraph({
			name: 'fan-in-partial-test',
			nodes: [
				createMediaProcessorBranchRouter({
					name: 'router',
					routes: [
						{
							name: 'transcribe',
							process: (frame) => ({
								...frame,
								id: `${frame.id}-transcribe`
							}),
							when: (frame) => frame.kind === 'input-audio'
						}
					]
				}),
				createMediaProcessorFanIn({
					expectedBranches: ['transcribe', 'record'],
					name: 'joiner'
				})
			]
		});

		expect(
			await graph.process(
				createMediaFrame({
					id: 'call-frame-1',
					kind: 'input-audio',
					source: 'telephony'
				})
			)
		).toEqual([]);

		const output = await graph.drain();
		expect(output).toHaveLength(1);
		expect(output[0]?.metadata?.mediaFanInStatus).toBe('partial');
		expect(output[0]?.metadata?.mediaFanInMissingBranches).toEqual(['record']);
	});

	test('queues and drops frames when graph backpressure limits are exceeded', async () => {
		let releaseFirstFrame: (() => void) | undefined;
		const graph = createMediaProcessorGraph({
			backpressureStrategy: 'queue',
			maxInFlightFrames: 1,
			maxQueuedFrames: 1,
			name: 'backpressure-test',
			nodes: [
				{
					name: 'slow',
					process: async (frame) => {
						if (frame.id === 'frame-1') {
							await new Promise<void>((resolve) => {
								releaseFirstFrame = resolve;
							});
						}
						return frame;
					}
				}
			]
		});

		const first = graph.process(
			createMediaFrame({
				id: 'frame-1',
				kind: 'input-audio',
				source: 'browser'
			})
		);
		const second = graph.process(
			createMediaFrame({
				id: 'frame-2',
				kind: 'input-audio',
				source: 'browser'
			})
		);
		const third = await graph.process(
			createMediaFrame({
				id: 'frame-3',
				kind: 'input-audio',
				source: 'browser'
			})
		);

		expect(third).toEqual([]);
		expect(graph.report().backpressure.queuedFrames).toBe(1);
		expect(graph.report().backpressure.droppedFrames).toBe(1);

		releaseFirstFrame?.();
		expect((await first).map((frame) => frame.id)).toEqual(['frame-1']);
		expect((await second).map((frame) => frame.id)).toEqual(['frame-2']);

		const report = graph.report();
		expect(report.backpressure.status).toBe('warn');
		expect(report.backpressure.maxObservedInFlight).toBe(1);
		expect(report.backpressure.maxObservedQueued).toBe(1);
		expect(report.status).toBe('warn');
	});

	test('reports node processing timing and latency budget warnings', async () => {
		const graph = createMediaProcessorGraph({
			maxNodeProcessingMs: 0,
			name: 'timing-test',
			nodes: [
				{
					name: 'passthrough',
					process: (frame) => frame
				}
			]
		});

		await graph.process(
			createMediaFrame({
				id: 'frame-1',
				kind: 'input-audio',
				source: 'browser'
			})
		);

		const report = graph.report();
		expect(graph.timingEvents()).toHaveLength(1);
		expect(report.timing.events).toHaveLength(1);
		expect(report.timing.maxNodeProcessingMs).toBe(0);
		expect(report.timing.overBudgetFrames).toBe(1);
		expect(report.timing.nodes[0]).toEqual(
			expect.objectContaining({
				node: 'passthrough',
				overBudgetFrames: 1,
				status: 'warn'
			})
		);
		expect(report.status).toBe('warn');
	});

	test('exports and parses portable graph snapshots', async () => {
		const graph = createMediaProcessorGraph({
			maxInFlightFrames: 2,
			maxNodeProcessingMs: 5,
			maxQueuedFrames: 3,
			name: 'snapshot-test',
			nodes: [
				{
					inputFormat: {
						channels: 1,
						container: 'raw',
						encoding: 'pcm_s16le',
						sampleRateHz: 16_000
					},
					kind: 'processor',
					name: 'passthrough',
					outputFormat: {
						channels: 1,
						container: 'raw',
						encoding: 'pcm_s16le',
						sampleRateHz: 16_000
					},
					process: (frame) => frame
				}
			]
		});

		await graph.process(
			createMediaFrame({
				id: 'frame-1',
				kind: 'input-audio',
				source: 'browser'
			})
		);

		const snapshot = graph.snapshot();
		expect(snapshot.schema).toBe('absolute.media.processor-graph.snapshot.v1');
		expect(snapshot.name).toBe('snapshot-test');
		expect(snapshot.limits).toEqual({
			maxInFlightFrames: 2,
			maxNodeProcessingMs: 5,
			maxQueuedFrames: 3
		});
		expect(snapshot.nodes).toEqual([
			expect.objectContaining({
				kind: 'processor',
				name: 'passthrough'
			})
		]);
		expect(snapshot.report.timingEvents).toHaveLength(1);
		expect(snapshot.report.edgeEvents).toHaveLength(1);
		expect(parseMediaProcessorGraphSnapshot(snapshot)).toEqual(snapshot);
		expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot);
	});

	test('marks graph and node failures when a processor throws', async () => {
		const graph = createMediaProcessorGraph({
			nodes: [
				{
					name: 'throws',
					process: () => {
						throw new Error('processor exploded');
					}
				}
			]
		});

		await expect(
			graph.process(
				createMediaFrame({
					id: 'input-1',
					kind: 'input-audio',
					source: 'browser'
				})
			)
		).rejects.toThrow('processor exploded');

		const report = graph.report();
		expect(graph.state()).toBe('failed');
		expect(report.status).toBe('fail');
		expect(report.errors.at(-1)?.kind).toBe('node-error');
		expect(report.nodes[0]?.status).toBe('fail');
		expect(report.nodes[0]?.errors.at(-1)?.error).toBe('processor exploded');
	});

	test('closes graph to reject future processing', async () => {
		const graph = createMediaProcessorGraph();
		await graph.close();

		await expect(
			graph.process(
				createMediaFrame({
					id: 'input-1',
					kind: 'input-audio',
					source: 'browser'
				})
			)
		).rejects.toThrow('closed');

		expect(graph.report().state).toBe('closed');
		expect(graph.report().status).toBe('fail');
	});
});
