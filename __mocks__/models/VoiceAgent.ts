const VoiceAgent: any = jest.fn()

VoiceAgent.find = jest.fn()
VoiceAgent.findByIdAndUpdate = jest.fn()
VoiceAgent.findByIdAndDelete = jest.fn()

export default VoiceAgent
