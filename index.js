const axios = require("axios");
const sharp = require('sharp');
const fs = require('fs');
const { Octokit } = require("@octokit/rest");
const octokit = new Octokit();

require('yargs')
    .command('contributors <repo>', 'generate an image',
        (yargs) => {
            yargs.positional('repo', {
                describe: 'OWNER/REPO or URL to the git repository.',
            })
        }, (args) => {
            generate(() => {
                parts = args.repo.split('/')
                if (parts.length < 2) {
                    console.error("unable to parse repo:", parts);
                    return process.exit(1)
                }

                let repo = parts[parts.length - 1];
                let owner = parts[parts.length - 2];
                console.log(owner);
                console.log(repo);

                return getContributorsForRepo(owner, repo);
            }, args);
        })
    .command('users <username...>', 'generate an image',
        (yargs) => {
            yargs.positional('username', {
                describe: 'Profile username.',
            })
        }, (args) => {
            generate(() => getUsersByUsername(args.username), args);
        })
    .option('avatar-padding', {
        type: 'number',
        description: 'Avatar padding.',
        default: 10
    })
    .option('avatar-size', {
        type: 'number',
        description: 'Avatar size.',
        default: 50
    })
    .option('avatar-radius', {
        type: 'number',
        description: 'Avatar corner radius.',
        default: 50
    })
    .option('canvasWidth', {
        type: 'number',
        description: 'Canvas width.',
        default: 600
    })
    .option('stroke-color', {
        type: 'array',
        description: 'Stroke color.',
        default: ['#DDD']
    })
    .option('stroke-width', {
        type: 'number',
        description: 'Stroke width.',
        default: 1
    })
    .option('style', {
        alias: 's',
        type: 'string',
        describe: 'Style JSON file. (overrides any provided args)'
    })
    .option('output', {
        alias: 'o',
        type: 'string',
        description: 'Output file.',
        defaultDescription: 'output to stdout'
    })
    .argv

function generate(getUsersFn, args) {
    console.log("generating...");
    if (args.style) {
        console.log("loading style from:", args.style);
        let styleConfig = JSON.parse(fs.readFileSync(args.style));
        console.log("loaded style:\n", styleConfig);
        args = { ...args, ...styleConfig };
    }

    let avatarPadding = args.avatarPadding;
    let avatarRadius = args.avatarRadius;
    let avatarSize = args.avatarSize;
    let canvasWidth = args.canvasWidth;
    let strokeColors = args.strokeColor;
    let strokeWidth = args.strokeWidth;

    getUsersFn().then((users) => {
        var promises = [];
        users.forEach((user) => {
            console.log(`downloading avatar ${user.login} from ${user.avatar_url}`)
            promises.push(
                axios({ url: user.avatar_url, responseType: "arraybuffer" })
                    .then((response) => response.data)
            )
        })

        return Promise.all(promises);
    })
        .then(async (images) => {
            let totalImages = images.length
            let imagesPerRow = Math.floor(canvasWidth / (avatarSize + avatarPadding));
            let totalRows = Math.ceil(totalImages / imagesPerRow);
            let canvasHeight = Math.ceil(totalRows * (avatarSize + avatarPadding));

            console.log("avatarSize =", avatarSize);
            console.log("avatarPadding =", avatarPadding);

            console.log("totalImages =", totalImages);
            console.log("totalRows =", totalRows);
            console.log("imagesPerRow =", imagesPerRow);

            console.log("canvasWidth =", canvasWidth);
            console.log("canvasHeight =", canvasHeight);

            console.log("strokeColors =", strokeColors);
            console.log("strokeWidth =", strokeWidth);

            var compositeImages = [];
            var i = 0;
            for (let row = 1; row <= totalRows; row++) {
                for (let col = 1; col <= imagesPerRow && i < totalImages; col++) {
                    let image = images[((row - 1) * imagesPerRow) + (col - 1)];
                    let buffer = await composeAvatar(
                        image,
                        avatarSize,
                        avatarRadius,
                        strokeColors[i % strokeColors.length],
                        strokeWidth
                    ).catch((e) => Promise.reject(`failed to generate image #${i}: ${JSON.stringify(e)}`))

                    compositeImages.push({
                        input: buffer,
                        top: ((row - 1) * (avatarSize + avatarPadding)) + avatarPadding / 2,
                        left: ((col - 1) * (avatarSize + avatarPadding)) + avatarPadding / 2
                    })
                    i++;
                }
            }

            return sharp({
                create: {
                    width: canvasWidth,
                    height: canvasHeight,
                    channels: 4,
                    background: { r: 255, g: 255, b: 255, alpha: 1.0 }
                }
            })
                .composite(compositeImages)
                .png()
                .toFile('output.png')
        })
        .catch((e) => {
            console.error("ERROR:", e);
            return process.exit(1);
        });

}

function sampleData() {
    return [
        {
            login: "jromero",
            avatar_url: "https://avatars1.githubusercontent.com/u/475559?v=4",
        },
        {
            login: "jromero",
            avatar_url: "https://avatars1.githubusercontent.com/u/475559?v=4",
        },
        {
            login: "jromero",
            avatar_url: "https://avatars1.githubusercontent.com/u/475559?v=4",
        }
    ];
}

function getUsersByUsername(usernames) {
    var promises = [];
    usernames.forEach((u) => {
        console.log("looking up:", u);
        promises.push(octokit.users.getByUsername({ username: u }))
    })

    return Promise.all(promises)
        .then((r) => r.map(e => e.data));

    return Promise.resolve(sampleData());
}

function getContributorsForRepo(owner, repo) {
    return octokit.repos.listContributors({
        owner,
        repo
    }).then((r) => r.data);

    return Promise.resolve(sampleData());
}

function composeAvatar(image, size, cornerRadius, strokeColor, strokeWidth) {
    try {
        let rect = Buffer.from(
            `<svg width="${size}" height="${size}">
                <rect x="${strokeWidth / 2}" y="${strokeWidth / 2}" 
                    width="${size - strokeWidth}" height="${size - strokeWidth}" 
                    rx="${cornerRadius}" ry="${cornerRadius}" 
                    fill="#f00" 
                    stroke="#f00" stroke-width="${strokeWidth}" />
            </svg>`
        );

        let border = Buffer.from(
            `<svg width="${size}" height="${size}">
                <rect x="${strokeWidth / 2}" y="${strokeWidth / 2}" 
                    width="${size - strokeWidth}" height="${size - strokeWidth}" 
                    rx="${cornerRadius}" ry="${cornerRadius}" 
                    fill="transparent" 
                    stroke="${strokeColor}" stroke-width="${strokeWidth}" />
            </svg>`
        );

        return sharp(image)
            .resize(size, size)
            .composite([
                { input: rect, blend: 'dest-in' },
                { input: border, blend: 'over' },
            ])
            .png()
            .toBuffer();
    } catch (e) {
        return Promise.reject(e);
    }
}