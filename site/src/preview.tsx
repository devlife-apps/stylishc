import React, { Component } from 'react';
import axios from 'axios';
import { types } from '@devlife-apps/stylishc';

export default class Profile extends Component<ProfileProps, ProfileState> {

    componentDidMount() {
        this.updatePreview();
    }

    updatePreview = () => {
        let that = this;
        axios({ url: `http://localhost:8080/contributors/${this.props.owner}/${this.props.repo}`, responseType: "arraybuffer" })
            .then((response: { data: any; }) => {
                this.setState({
                    image: Buffer.from(response.data, 'binary')
                })
            })
    }

    render() {
        if (this.state?.image == null) {
            return <p></p>;
        }
        return (
            <img src={`data:image/png;base64, ${this.state.image.toString('base64')}`} />
        )
    }
}

interface ProfileProps extends types.Style {
    owner: string,
    repo: string,
}

interface ProfileState {
    image: Buffer
}