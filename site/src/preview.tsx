import React, { Component } from 'react';

import { types } from '@devlife-apps/stylishc';
import * as github from '@devlife-apps/stylishc/lib/github';

const gh = new github.GitHubSource();

export default class Profile extends Component<ProfileProps, ProfileState> {
    state: ProfileState = {
        users: [{
            login: "jromero",
            avatar_url: ""
        }],
    };

    updatePreview = () => {
        let that = this;
        gh.getContributorsForRepo(this.props.owner, this.props.repo, 100).then((users) => {
            that.setState({
                users: users   
            })
        })
    }

    render() {
        let userListItems = this.state.users.map(u => <li>{u.login}</li>);
        return (
            <div>
                <ul>
                {userListItems}
                </ul>
            </div>
        )
    }
}

interface ProfileProps extends types.Style {
    owner: string,
    repo: string,
}

interface ProfileState {
    users: Array<types.User>
}