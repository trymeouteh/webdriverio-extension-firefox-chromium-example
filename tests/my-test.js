test('My Test', async () => {
	const EXTENSION_ID = await browser.extensionGetId('My Extension')

	await browser.extensionURL(EXTENSION_ID, 'my-page.html')

	const buttonElement = await $('button')
	await buttonElement.click();

	await browser.pause(3000);
});
