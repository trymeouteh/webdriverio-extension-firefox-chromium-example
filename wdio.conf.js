import { readFileSync, rmSync } from 'fs';
import { execSync } from 'child_process';
import { tmpdir } from 'os';

const EXTENSION_NAME = 'my-extension';

export const config = {
	capabilities: [
		{
			browserName: 'firefox',
		},
		{
			browserName: 'chromium',
			'goog:chromeOptions': {
				args: ['--load-extension=./src/'],
			},
		},
	],

	//Needed for chromium
	maxInstances: 1,

	specs: ['./tests/*.js'],

	framework: 'mocha',
	mochaOpts: {
		ui: 'tdd',
	},

	onPrepare: function() {
		extensionCreateFirefox(EXTENSION_NAME);
	},

	before: async function() {
		await extensionLoadFirefox(EXTENSION_NAME);

		browser.addCommand('extensionGetId', extensionGetId);
		browser.addCommand('extensionURL', extensionURL);
	},

	onComplete: function() {
		extensionDeleteFirefox(EXTENSION_NAME);
	}
};

//Create Firefox extension xpi file using web-ext
function extensionCreateFirefox(extensionName) {
	execSync(`npx web-ext build -s ./src/ -a ${tmpdir()} -n ${extensionName}.xpi`);
}

async function extensionLoadFirefox(extensionName) {
	if (browser.capabilities.browserName === 'firefox') {
		await browser.installAddOn(readFileSync(`${tmpdir()}/${extensionName}.xpi`).toString('base64'), true);
	}
}

async function extensionGetId(extensionName) {
	if (browser.capabilities.browserName === 'firefox') {
		return await extensionGetIdFirefox(extensionName)
	}

	return await extensionGetIdChromium(extensionName);
}

async function extensionGetIdFirefox(extensionName) {
	await browser.url('about:debugging#/runtime/this-firefox');

	const temporaryExtensionElements = await browser.$('.qa-debug-target-pane .qa-debug-target-list').$$('li');

	let extensionId;
	for (let index = 0; !extensionId && index < temporaryExtensionElements.length; index++) {
		const currentTemporaryExtensionNameElement = await temporaryExtensionElements[index].$('.debug-target-item__name');
		if (await currentTemporaryExtensionNameElement.getText() === extensionName) {
			const currentTemporaryExtensionIdElement =  await temporaryExtensionElements[index].$('dl').$$('.fieldpair .fieldpair__description')[2];
			extensionId = await currentTemporaryExtensionIdElement.getText();
		}
	}

	return extensionId;
}

async function extensionGetIdChromium(extensionName) {
	await browser.url('chrome://extensions/');

	const extensionElements = await browser.$$('extensions-item');
	const extensionElement = await extensionElements.find(async (currentExtensionElement) => (
		await currentExtensionElement.$('#name').getText()) === extensionName
	)

	return await extensionElement.getAttribute('id');
}

async function extensionURL(extensionId, url) {
	if (browser.capabilities.browserName === 'firefox') {
		return await extensionURLFirefox(extensionId, url)
	}

	return await extensionURLChromium(extensionId, url);
}

async function extensionURLFirefox(extensionId, url) {
	return await browser.url(`moz-extension://${extensionId}/${url}`);
}

async function extensionURLChromium(extensionId, url) {
	return await browser.url(`chrome-extension://${extensionId}/${url}`);
}

//Delete Firefox extension xpi file
function extensionDeleteFirefox(extensionName) {
	rmSync(`${tmpdir()}/${extensionName}.xpi`);
}