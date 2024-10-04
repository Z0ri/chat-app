export class Message{
    constructor(
        public authorId: string | null = '',
        public content: string = '',
        public timeStamp: Date
    ){}
}