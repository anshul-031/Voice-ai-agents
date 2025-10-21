describe('Mongoose schema definitions', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('configures Campaign schema defaults and indexes', async () => {
    const mongoose = await import('mongoose')
    await import('@/models/Campaign')

    const schemaMock = mongoose.Schema as unknown as jest.Mock
    const schemaCalls = schemaMock.mock.calls
    expect(schemaCalls.length).toBeGreaterThan(0)
    const campaignDefinition = schemaCalls[schemaCalls.length - 1][0]

    expect(campaignDefinition.status.default).toBe('running')
    expect(campaignDefinition.agent_id.default).toBe('emi reminder')
    expect(campaignDefinition.total_contacts.default).toBe(0)
    expect(campaignDefinition.calls_completed.default).toBe(0)
    expect(campaignDefinition.calls_failed.default).toBe(0)

    const [campaignSchemaInstance] = schemaMock.mock.instances as Array<{ index: jest.Mock }>
    expect(campaignSchemaInstance.index).toHaveBeenCalledWith({ user_id: 1, updated_at: -1 })
    expect(campaignSchemaInstance.index).toHaveBeenCalledWith({ status: 1 })
  })

  it('configures CampaignContact schema defaults and indexes', async () => {
    const mongoose = await import('mongoose')
    await import('@/models/CampaignContact')

    const schemaMock = mongoose.Schema as unknown as jest.Mock
    const schemaCalls = schemaMock.mock.calls
    expect(schemaCalls.length).toBeGreaterThan(0)
    const contactDefinition = schemaCalls[schemaCalls.length - 1][0]

    expect(contactDefinition.call_done.default).toBe('no')
    expect(contactDefinition.call_status.default).toBe('pending')
    expect(contactDefinition.description.default).toBe('')

    const [contactSchemaInstance] = schemaMock.mock.instances as Array<{ index: jest.Mock }>
    expect(contactSchemaInstance.index).toHaveBeenCalledWith({ campaign_id: 1, call_done: 1 })
  })
})
