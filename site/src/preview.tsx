import React, { Component } from 'react';

import { Style, User } from '@devlife-apps/stylishc';
import { GitHubSource } from '@devlife-apps/stylishc/lib/github';

const gh = new GitHubSource();

export default class Profile extends Component<ProfileProps, ProfileState> {
    state: ProfileState = {
        users: [],
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

interface ProfileProps extends Style {
    owner: string,
    repo: string,
}

interface ProfileState {
    users: Array<User>
}