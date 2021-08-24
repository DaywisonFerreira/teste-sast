interface IBody {
    text?: string
    html?: string
}

interface IAttachments {
    path: string
    fileName: string
}

export default interface IEmail {
    to: string
    subject: string
    from?: string
    replyTo?: string
    body?: IBody
    attachments?: IAttachments[]
}
