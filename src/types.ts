export type AudioFormat = {
	container: 'raw';
	encoding: 'alaw' | 'mulaw' | 'pcm_s16le';
	sampleRateHz: number;
	channels: 1 | 2;
};
