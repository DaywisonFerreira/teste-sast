interface IBody{
    text?:string,
    html?:string
}

interface IAttachments{
    path: string,
    fileName: string
}

export default interface IEmail {
    from: string,
    to: string,
    subject: string,
    body?: IBody
    attachments?: IAttachments[],
}
