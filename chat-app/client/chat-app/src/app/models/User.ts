export class User{
    constructor(
        public socketId: string = '',
        public profilePic: string = '',
        public username: string = '',
        public email: string = '',
        public password: string = '',
    ) {}
}