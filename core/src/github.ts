
import { Octokit } from '@octokit/rest';
import { User } from './types';

export class GitHubSource {
    octokit: Octokit;
    
    constructor(octokit?: Octokit) {
        this.octokit = octokit || new Octokit();
    }

    getContributorsForRepo(owner: string, repo: string, maxUsers: number): Promise<Array<User>> {
        return this.octokit.repos.listContributors({
            owner,
            repo,
            per_page: maxUsers
        }).then(e => e.data);
    }

    getUsersByUsername(usernames: Array<string>): Promise<Array<User>> {
        var promises = new Array();
        usernames.forEach((u) => {
            console.log("looking up:", u);
            let p = this.octokit.users.getByUsername({ username: u });
            promises.push(p);
        });
    
        return Promise.all(promises)
            .then((r) => r.map(e => e.data));
    }
}
