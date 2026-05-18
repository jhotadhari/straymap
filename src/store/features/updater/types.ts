export type UpdateResults = {
	[value: string]: // the version updating from
	{
		state: 'failed' | 'updating' | 'success';
		msg?: string;
	};
};
