#!/usr/bin/env node

import express from "express";
import cors from "cors";
import { github, generator, styles } from "@devlife-apps/stylishc";
import { Octokit } from '@octokit/rest';
import cryptojs from "crypto-js";

const server = express();
const corsConfig = cors();
const octokit = new Octokit();
const port = 8080; // default port to listen

const gh = new github.GitHubSource(octokit);

server.use(corsConfig);

interface ContributorsRequest {
    owner: string
    repo: string
}

// contributors (redirects to permalink)
// return - redirects to permalink where data is encrypted
server.get("/contributors/:owner/:repo", (req, res) => {
    let contribRequest: ContributorsRequest = {
        owner: req.params.owner,
        repo: req.params.repo,
    }
    let data = cryptojs.AES.encrypt(JSON.stringify(contribRequest), "super-secret-key-123456")
        .toString()
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    res.statusCode = 302;
    res.location(`${req.baseUrl}/c/${data}`);
    res.end();
});

// contributors permalink
// :data - encrypted data necessary to satisfy request
server.get("/c/:data", (req, res) => {
    console.log("data (decrypted): ", req.params.data);
    let dataValue = cryptojs.AES
        .decrypt(
            req.params.data
                .replace(/-/g, '+')
                .replace(/_/g, '/'),
            "super-secret-key-123456"
        )
        .toString(cryptojs.enc.Utf8);

    console.log("data (decrypted): ", dataValue);
    let contribRequest: ContributorsRequest = JSON.parse(dataValue);

    generator.generate(
        () => gh.getContributorsForRepo(contribRequest.owner, contribRequest.repo, 100), styles.defaultStyle,
    )
        .then(s => s.toBuffer())
        .then(b => {
            res.writeHead(200, {
                'Content-Type': "image/png",
                'Content-Length': b.length
            })
            res.end(b);
        })
})

server.listen(port, () => {
    // tslint:disable-next-line:no-console
    console.log(`server started at http://localhost:${port}`);
});