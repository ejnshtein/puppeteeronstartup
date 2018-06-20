const puppeteer = require('puppeteer'),
    app = require('express')(),
    bodyParser = require('body-parser'),
    port = 80

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

firstStart() // async

async function firstStart() {
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--start-fullscreen', '--disable-infobars' // launch fullscreen and without info bar “Chrome is being controlled by automated test software”
        ]
    })
    let page = await browser.newPage()
    await goto('https://youtube.com')
    async function goto(url) { // goto function
        return new Promise(async (res, rej) => {
            page || (page = await browser.newPage())
            await page.goto(url)
            await page.setViewport({
                width: 1920, // page width
                height: 1080, // page height
                isLandscape: true
            })
            await page.waitForSelector(/youtube/ig.test(url) ? '#movie_player' : 'body') // wait for page load
            await page.evaluate(() => { // set volume level
                let ytvl = JSON.parse(window.localStorage.getItem('yt-player-volume')) || {
                    creation: Date.now(),
                    data: {},
                    expiration: Date.now() + 1000 * 60 * 60 * 24 * 30
                }
                ytvl.data = JSON.stringify({
                    volume: 20, // here's volume level
                    muted: false
                })
                window.localStorage.setItem('yt-player-volume', JSON.stringify(ytvl))
            })
            let ads = await page.evaluate(() => { // check for ads
                let hmmm
                try {
                    hmmm = document.querySelector('#movie_player > div.video-ads > div > div > div.videoAdUiSkipContainer.html5-stop-propagation > button')
                } catch (e) {
                    hmmm = null
                }
                return hmmm
            })
            if (ads) { // if ads(may not work sometimes)
                setTimeout(async () => {
                    await page.click('#movie_player > div.video-ads > div > div > div.videoAdUiSkipContainer.html5-stop-propagation > button')
                },8000)
            }
            let video = await page.evaluate(() => { // check for video on page
                let hmmm
                try {
                    hmmm = document.querySelector('#movie_player > div.html5-video-container > video').src
                } catch (e) {
                    hmmm = null
                }
                return hmmm
            })
            if (video) { // Click if there's video
                await page.click('#movie_player > div.ytp-chrome-bottom > div.ytp-chrome-controls > div.ytp-right-controls > button.ytp-fullscreen-button.ytp-button')
            }
            res()
        })
    }

    app.get('/close', async (req, res) => {
        await page.close() // close page
        page = null
        res.status(200).send('done')
    })

    app.post('/goto', async (req, res) => {
        await goto(req.body.url) // goto page
        res.status(200).send('done')
    })

    app.listen(port, () => {
        console.log(`Listening on port ${port}`)
    })

}