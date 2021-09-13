interface UsersRooms {
    socketId: string,
    email: string,
    userId: string,
    userName: string,
}

interface Notification {
    read: Boolean
    messageType: MessagesTypes,
    payload?: any,
}

enum MessagesTypes {
    DownloadXlsxOrders
}

export { UsersRooms, Notification }
