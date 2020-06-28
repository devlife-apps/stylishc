#!/usr/bin/env node

import express from "express";
import { generate, defaultStyle } from "../core";
import * as gh from "../core/github";
import { Octokit } from '@octokit/rest';

const server = express();
const octokit = new Octokit();
const port = 8080; // default port to listen

// contributors
server.get("/c/:owner/:repo", (req, res) => {
    let owner = req.params.owner
    let repo = req.params.repo

    generate(
        () => gh.getContributorsForRepo(octokit, owner, repo, 100), defaultStyle,
    )
        .then(s => s.toBuffer())
        .then(b => {
            res.writeHead(200, {
                'Content-Type': "image/png",
                'Content-Length': b.length
            })
            res.end(b);
        })
});

server.listen(port, () => {
    // tslint:disable-next-line:no-console
    console.log(`server started at http://localhost:${port}`);
});