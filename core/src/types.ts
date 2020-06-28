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