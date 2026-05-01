import { describe, expect, test } from 'bun:test';
import { createMediaFrame, createMediaProcessorGraph } from '../src';

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
