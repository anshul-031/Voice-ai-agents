const Chat: any = jest.fn()

Chat.find = jest.fn()
Chat.aggregate = jest.fn()
Chat.deleteMany = jest.fn()

export default Chat
