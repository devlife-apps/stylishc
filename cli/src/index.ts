#!/usr/bin/env node

import fs from 'fs';
import yarg from 'yargs';
import { Octokit } from '@octokit/rest';
import { Style, generate } from '@devlife-apps/stylishc';

import { GitHub } from '@devlife-apps/stylishc';

const octokit = new Octokit();
const gh = new GitHub.GitHubSource(octokit);
            
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

            return gh.getContributorsForRepo(owner, repo, args.limit);
        }, applyStyle(args))
        .then(f => f.toFile(args.output))
        .catch(e => {
            console.error(e);
            process.exit(1);
        });
    })
    .command(
        'users <username...>',
        'Generate an image including only the provided users.',
        (yargs) => {
            yargs.positional('username', {
                describe: 'Profile username.',
            })
        }, (args: UsersArgs) => {
            generate(() => gh.getUsersByUsername(args.username), applyStyle(args))
            .then(f => f.toFile(args.output))
            .catch(e => {
                console.error(e);
                process.exit(1);
            });
        })
    .option('avatar-padding', {
        type: 'number',
        description: 'Avatar padding.',
        default: 10
    })
    .option('avatar-radius', {
        type: 'number',
        description: 'Avatar corner radius.',
        default: 50
    })
    .option('avatar-size', {
        type: 'number',
        description: 'Avatar size.',
        default: 50
    })
    .option('canvas-color', {
        type: 'string',
        description: 'Canvas color.',
        default: '#FFF0'
    })
    .option('canvas-width', {
        type: 'number',
        description: 'Canvas width.',
        default: 900
    })
    .option('stroke-color', {
        type: 'array',
        description: 'Stroke color.',
        default: ['#CCC']
    })
    .option('stroke-width', {
        type: 'number',
        description: 'Stroke width.',
        default: 2
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

interface CmdArgs extends Style {
    style: string
    output: string
}

interface ContributorsArgs extends CmdArgs {
    repo: string
    limit: number
}

interface UsersArgs extends CmdArgs {
    username: Array<string>
}

function applyStyle<T extends CmdArgs>(args: T): T {
    if (args.style) {
        console.log("loading style from:", args.style);
        let styleConfig = JSON.parse(fs.readFileSync(args.style).toString());
        console.log("loaded style:\n", styleConfig);

        return { ...args, ...styleConfig };
    }

    return args;
}