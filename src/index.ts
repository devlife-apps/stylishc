#!/usr/bin/env node

import axios from "axios";
import sharp from 'sharp';
import fs from 'fs';
import yarg from 'yargs';
import { Octokit } from '@octokit/rest';
const octokit = new Octokit();

yarg.command(
    'contributors <repo>',
    'Generate an image of the contributors for given repository.',
    (yargs) => {
        yargs.positional('repo', {
            describe: 'OWNER/REPO or URL to the git repository.',
        })
    }, (args: ContributorsArgs) => {
        generate(() => {
            const parts = args.repo.split('/')
            if (parts.length < 2) {
                console.error("unable to parse repo:", parts);
                return process.exit(1)
            }

            let repo = parts[parts.length - 1];
            let owner = parts[parts.length - 2];
            console.log("owner =", owner);
            console.log("repo =", repo);

            return getContributorsForRepo(owner, repo, args.limit);
        }, args);
    })
    .command(
        'users <username...>',
        'Generate an image including only the provided users.',
        (yargs) => {
            yargs.positional('username', {
                describe: 'Profile username.',
            })
        }, (args: UsersArgs) => {
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
        default: 900
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
    .option('limit', {
        type: 'number',
        description: 'Limit number of users. (max 100)',
        default: 100
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
        default: 'contributors.png'
    })
    .argv

interface User {
    login: string;
    avatar_url: string;
}

interface Args {
    avatarPadding: number;
    avatarRadius: number;
    avatarSize: number;
    canvasWidth: number;
    limit: number;
    output: string;
    strokeColor: Array<string>;
    strokeWidth: number;
    style: string;
}

interface ContributorsArgs extends Args {
    repo: string
}

interface UsersArgs extends Args {
    username: Array<string>
}

function generate(getUsersFn: () => Promise<Array<User>>, args: Args) {
    console.log("generating...");
    if (args.style) {
        console.log("loading style from:", args.style);
        let styleConfig = JSON.parse(fs.readFileSync(args.style).toString());
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
        var promises: Array<Promise<Buffer>> = [];
        users.forEach((user) => {
            console.log(`downloading avatar ${user.login} from ${user.avatar_url}`)
            promises.push(
                axios({ url: user.avatar_url, responseType: "arraybuffer" })
                    .then((response: { data: any; }) => response.data)
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
                        top: Math.ceil(((row - 1) * (avatarSize + avatarPadding)) + avatarPadding / 2),
                        left: Math.ceil(((col - 1) * (avatarSize + avatarPadding)) + avatarPadding / 2)
                    })
                    i++;
                }
            }

            return sharp({
                create: {
                    width: canvasWidth,
                    height: canvasHeight,
                    channels: 4,
                    background: { r: 255, g: 255, b: 255, alpha: 0.0 }
                }
            })
                .composite(compositeImages)
                .png({
                    adaptiveFiltering: true,
                    compressionLevel: 9,
                    dither: 1.0,
                    palette: true,
                    progressive: false,
                    quality: 100,
                })
                .toFile(args.output)
        })
        .catch((e) => {
            console.error("ERROR:", e);
            return process.exit(1);
        });

}

function getUsersByUsername(usernames: Array<string>): Promise<Array<User>> {
    var promises = new Array();
    usernames.forEach((u) => {
        console.log("looking up:", u);
        let p = octokit.users.getByUsername({ username: u });
        promises.push(p);
    });

    return Promise.all(promises)
        .then((r) => r.map(e => e));
}

function getContributorsForRepo(owner: string, repo: string, maxUsers: number): Promise<Array<User>> {
    return octokit.repos.listContributors({
        owner,
        repo,
        per_page: maxUsers
    }).then(e => e.data);
}

function composeAvatar(image: Buffer, size: number, cornerRadius: number, strokeColor: string, strokeWidth: number) {
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
            .composite([
                { input: rect, blend: 'dest-in' },
                { input: border, blend: 'over' },
            ])
            .resize(size, size)
            .png()
            .toBuffer();
    } catch (e) {
        return Promise.reject(e);
    }
}