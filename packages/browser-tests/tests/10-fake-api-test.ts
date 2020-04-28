import mocha from 'mocha';
import chai from 'chai';
import { FakeData, setFakeData, prepareQuery, sendQuery } from './fake-api';
import { API } from '@iconify/core/lib/api/';
import { setAPIModule } from '@iconify/core/lib/api/modules';
import { setAPIConfig } from '@iconify/core/lib/api/config';
import { coreModules } from '@iconify/core/lib/modules';

const expect = chai.expect;

// Set API
setAPIModule({
	prepare: prepareQuery,
	send: sendQuery,
});
coreModules.api = API;

let prefixCounter = 0;
function nextPrefix(): string {
	return 'fake-api-' + prefixCounter++;
}

describe('Testing fake API', () => {
	it('Loading results', done => {
		const prefix = nextPrefix();
		const data: FakeData = {
			icons: ['icon1', 'icon2'],
			data: {
				prefix,
				icons: {
					icon1: {
						body:
							'<path d="M10 20v-6h4v6h5v-8h3L12 3L2 12h3v8h5z" fill="currentColor"/>',
					},
					icon2: {
						body:
							'<path d="M12 4a4 4 0 0 1 4 4a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4z" fill="currentColor"/>',
					},
				},
				width: 24,
				height: 24,
			},
		};
		setAPIConfig(
			{
				resources: ['https://api1.local', 'https://api2.local'],
			},
			prefix
		);
		setFakeData(prefix, data);

		// Attempt to load icons
		API.loadIcons(
			[prefix + ':icon1', prefix + ':icon2'],
			(loaded, missing, pending) => {
				expect(loaded).to.be.eql([
					{
						prefix,
						name: 'icon1',
					},
					{
						prefix,
						name: 'icon2',
					},
				]);
				done();
			}
		);
	});

	it('Loading results with delay', done => {
		const prefix = nextPrefix();
		const data: FakeData = {
			icons: ['icon1', 'icon2'],
			delay: 100,
			data: {
				prefix,
				icons: {
					icon1: {
						body:
							'<path d="M10 20v-6h4v6h5v-8h3L12 3L2 12h3v8h5z" fill="currentColor"/>',
					},
					icon2: {
						body:
							'<path d="M12 4a4 4 0 0 1 4 4a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4z" fill="currentColor"/>',
					},
				},
				width: 24,
				height: 24,
			},
		};
		setAPIConfig(
			{
				resources: ['https://api1.local', 'https://api2.local'],
			},
			prefix
		);
		setFakeData(prefix, data);

		// Attempt to load icons
		const start = Date.now();
		API.loadIcons(
			[
				{
					prefix,
					name: 'icon1',
				},
				{
					prefix,
					name: 'icon2',
				},
			],
			(loaded, missing, pending) => {
				expect(loaded).to.be.eql([
					{
						prefix,
						name: 'icon1',
					},
					{
						prefix,
						name: 'icon2',
					},
				]);
				const end = Date.now();
				expect(end - start).to.be.at.least(50);
				expect(end - start).to.be.at.most(150);
				done();
			}
		);
	});

	it('Loading partial results', done => {
		const prefix = nextPrefix();
		const data: FakeData = {
			icons: ['icon1'],
			delay: 20,
			data: {
				prefix,
				icons: {
					icon1: {
						body:
							'<path d="M10 20v-6h4v6h5v-8h3L12 3L2 12h3v8h5z" fill="currentColor"/>',
					},
				},
				width: 24,
				height: 24,
			},
		};
		setAPIConfig(
			{
				resources: ['https://api1.local', 'https://api2.local'],
				rotate: 20,
				timeout: 100,
				limit: 1,
			},
			prefix
		);
		setFakeData(prefix, data);

		// Attempt to load icons
		let counter = 0;
		API.loadIcons(
			[prefix + ':icon1', prefix + ':icon2'],
			(loaded, missing, pending) => {
				try {
					counter++;
					switch (counter) {
						case 1:
							// Loaded icon1
							expect(loaded).to.be.eql([
								{
									prefix,
									name: 'icon1',
								},
							]);
							expect(pending).to.be.eql([
								{
									prefix,
									name: 'icon2',
								},
							]);
							expect(missing).to.be.eql([]);
							done();
							break;

						case 2:
							done(
								'Callback should not be called ' +
									counter +
									' times.'
							);
					}
				} catch (err) {
					done(err);
				}
			}
		);
	});
});
