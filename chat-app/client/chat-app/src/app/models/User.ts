export class User{
    constructor(
        public userId: string = '',
        public socketId: string = '',
        public profilePic: string = '',
        public username: string = '',
        public email: string = '',
        public password: string = '',
    ) {}
}
