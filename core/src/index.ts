import axios from "axios";
import sharp, { Sharp } from 'sharp';

export * as GitHub from "./github";

export interface User {
    login: string;
    avatar_url: string;
}

export interface Style {
    avatarPadding: number;
    avatarRadius: number;
    avatarSize: number;
    canvasColor: string;
    canvasWidth: number;
    strokeColor: Array<string>;
    strokeWidth: number;
}

export const defaultStyle: Style = {
    avatarPadding: 10,
    avatarRadius: 50,
    avatarSize: 50,
    canvasColor: '#FFF0',
    canvasWidth: 900,
    strokeColor: ['#CCC'],
    strokeWidth: 2
};

export function generate(getUsersFn: () => Promise<Array<User>>, args: Style): Promise<Sharp> {
    args = { ...defaultStyle, ...args};

    console.log("generating...");

    return getUsersFn().then((users) => {
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
            let avatarPadding = args.avatarPadding;
            let avatarSize = args.avatarSize;
            let totalImages = images.length
            let imagesPerRow = Math.floor(args.canvasWidth / (avatarSize + avatarPadding));
            let totalRows = Math.ceil(totalImages / imagesPerRow);
            let canvasHeight = Math.ceil(totalRows * (avatarSize + avatarPadding));

            console.log("avatarSize =", avatarSize);
            console.log("avatarPadding =", avatarPadding);

            console.log("totalImages =", totalImages);
            console.log("totalRows =", totalRows);
            console.log("imagesPerRow =", imagesPerRow);

            console.log("canvasHeight =", canvasHeight);

            var compositeImages = [];
            var i = 0;
            for (let row = 1; row <= totalRows; row++) {
                for (let col = 1; col <= imagesPerRow && i < totalImages; col++) {
                    let image = images[((row - 1) * imagesPerRow) + (col - 1)];
                    let buffer = await composeAvatar(
                        image,
                        avatarSize,
                        args.avatarRadius,
                        args.strokeColor[i % args.strokeColor.length],
                        args.strokeWidth
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
                    width: args.canvasWidth,
                    height: canvasHeight,
                    channels: 4,
                    background: args.canvasColor
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
        })
        .catch((e) => {
            return Promise.reject(e);
        });
}

export function composeAvatar(image: Buffer, size: number, cornerRadius: number, strokeColor: string, strokeWidth: number): Promise<Buffer> {
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
