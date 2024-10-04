export class Message{
    constructor(
        public authorId: string | null = '',
        public receiverId: string = '',
        public content: string = '',
        public timeStamp: Date
    ){}
}