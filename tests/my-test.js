test('My Test', async () => {
	const EXTENSION_ID = await browser.extensionGetId('My Extension')

	await browser.extensionURL(EXTENSION_ID, 'my-page.html')

	await browser.pause(3000);
});
