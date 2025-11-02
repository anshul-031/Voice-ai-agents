import AgentModal from '@/components/AgentModal';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockAgent = {
    id: 'agent-123',
    userId: 'user-321',
    title: 'Test Agent',
    prompt: 'Prompt',
    llmModel: 'Gemini 1.5 Flash',
    sttModel: 'AssemblyAI Universal',
    ttsModel: 'Sarvam Manisha',
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString(),
};

const jsonResponse = (data: unknown, ok = true) => ({
    ok,
    json: async () => data,
}) as Response;

describe('AgentModal tool configuration', () => {
    const longRunningTestTimeout = 15000;
    const originalFetch = global.fetch;
    let fetchMock: jest.MockedFunction<typeof fetch>;
    let alertSpy: jest.SpyInstance;
    let confirmSpy: jest.SpyInstance;
    let user: ReturnType<typeof userEvent.setup>;

    beforeEach(() => {
        fetchMock = jest.fn();
        global.fetch = fetchMock;
        alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => undefined);
        confirmSpy = jest.spyOn(window, 'confirm').mockImplementation(() => true);
        user = userEvent.setup({ delay: 0 });
    });

    afterEach(() => {
        confirmSpy.mockRestore();
        alertSpy.mockRestore();
        global.fetch = originalFetch;
        jest.resetAllMocks();
    });

    const renderModal = (agentOverride: typeof mockAgent | null | undefined = mockAgent) => render(
        <AgentModal
            isOpen
            onClose={jest.fn()}
            agent={(agentOverride ?? undefined) as never}
            onSuccess={jest.fn()}
        />,
    );

    it('handles non-array tool responses gracefully', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse({ tools: null }));

        renderModal();

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith('/api/agent-tools?agentId=agent-123');
            expect(screen.getByText('0 configured tools')).toBeInTheDocument();
        });
    });

    it('surfaces an error when initial tool loading fails', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: false,
            json: async () => { throw new Error('invalid json'); },
        } as unknown as Response);

        renderModal();

        expect(await screen.findByText('Unable to load tools for this agent.')).toBeInTheDocument();
        expect(fetchMock).toHaveBeenCalledWith('/api/agent-tools?agentId=agent-123');
    });

    it('prompts to save the agent before enabling tools when no id exists', () => {
        renderModal({ ...mockAgent, id: '' } as typeof mockAgent);

        expect(screen.getByText('Save the agent first to add tools and webhook configurations.')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /add tool/i })).not.toBeInTheDocument();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('prevents tool submission when required fields are missing', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse({ tools: [] }));
        renderModal();

        await user.click(await screen.findByRole('button', { name: /add tool/i }));
        await user.click(screen.getByRole('button', { name: /create tool/i }));

        expect(alertSpy).toHaveBeenCalledWith('Tool name and webhook URL are required.');
        expect(fetchMock).toHaveBeenCalledTimes(1); // initial tools fetch only
    });

    it('submits sanitized payload when creating a new tool', async () => {
        fetchMock
            .mockResolvedValueOnce(jsonResponse({ tools: [] }))
            .mockResolvedValueOnce(jsonResponse({ success: true }))
            .mockResolvedValueOnce(jsonResponse({ tools: [] }));
    renderModal();

        await user.click(await screen.findByRole('button', { name: /add tool/i }));

        const nameInput = screen.getByPlaceholderText('e.g., Create Ticket');
        await user.clear(nameInput);
        await user.type(nameInput, '  Incident Creator  ');

        const urlInput = screen.getByPlaceholderText('https://example.com/api/action');
        await user.type(urlInput, ' https://hooks.example.com/create ');

        const descriptionInput = screen.getByPlaceholderText('Describe what this tool does so the agent knows when to use it');
        await user.type(descriptionInput, '  creates incidents  ');

        const triggerInput = screen.getByPlaceholderText('Comma or newline separated phrases that should invoke the tool');
        await user.type(triggerInput, ' run report,\n escalate ');

        const successInput = screen.getByPlaceholderText('What should the agent say when the call succeeds?');
        await user.type(successInput, '  success!  ');

        const failureInput = screen.getByPlaceholderText('Fallback message if the webhook fails');
        await user.type(failureInput, ' failure ');

        await user.click(screen.getByRole('button', { name: /add header/i }));
        const headerNameInput = screen.getByPlaceholderText('Header name (e.g., Authorization)');
        await user.type(headerNameInput, ' Authorization ');
        const headerValueInput = screen.getByPlaceholderText('Header value');
        await user.type(headerValueInput, ' Bearer token ');

    await user.click(screen.getByRole('button', { name: /add parameter/i }));
    const parameterNameInput = screen.getByPlaceholderText('e.g., ticketId');
        await user.clear(parameterNameInput);
        await user.type(parameterNameInput, ' flag ');

        const parameterContainer = parameterNameInput.closest('div');
        if (!parameterContainer) {
            throw new Error('parameter container not found');
        }

        const parameterSelect = parameterContainer.parentElement?.querySelector('select') as HTMLSelectElement | undefined;
        if (!parameterSelect) {
            throw new Error('parameter select not found');
        }
        await user.selectOptions(parameterSelect, 'boolean');

    const descriptionField = screen.getByPlaceholderText('Explain what value the agent should capture');
        await user.type(descriptionField, '  should be yes/no  ');

        await user.click(screen.getByLabelText(/required/i));
        await user.click(screen.getByLabelText(/Run automatically after the call ends/i));

        await user.click(screen.getByRole('button', { name: /create tool/i }));

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith(
                '/api/agent-tools',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: expect.any(String),
                }),
            );
        });

        const [, postCall] = fetchMock.mock.calls;
        const payload = JSON.parse(postCall[1]?.body as string);

        expect(payload).toEqual({
            agentId: mockAgent.id,
            userId: mockAgent.userId,
            name: 'Incident Creator',
            description: 'creates incidents',
            webhookUrl: 'https://hooks.example.com/create',
            method: 'POST',
            headers: [{ key: 'Authorization', value: 'Bearer token' }],
            parameters: [{
                name: 'flag',
                description: 'should be yes/no',
                type: 'boolean',
                required: true,
            }],
            triggerPhrases: ['run report', 'escalate'],
            successMessage: 'success!',
            failureMessage: 'failure',
            runAfterCall: true,
        });

        expect(fetchMock).toHaveBeenCalledTimes(3);
    }, longRunningTestTimeout);

    it('surfaces API errors when tool save fails', async () => {
        fetchMock
            .mockResolvedValueOnce(jsonResponse({ tools: [] }))
            .mockResolvedValueOnce(jsonResponse({ error: 'Bad Request' }, false));
        renderModal();

        await user.click(await screen.findByRole('button', { name: /add tool/i }));

        await user.type(screen.getByPlaceholderText('e.g., Create Ticket'), 'Failing Tool');
        await user.type(screen.getByPlaceholderText('https://example.com/api/action'), 'https://hooks.example.com/fail');

        await user.click(screen.getByRole('button', { name: /create tool/i }));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Bad Request');
        });

        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('prefills and updates an existing tool via PUT', async () => {
        const existingTool = {
            _id: 'tool-1',
            userId: mockAgent.userId,
            agentId: mockAgent.id,
            name: 'Support Ticket',
            description: 'Creates support tickets',
            webhookUrl: 'https://hooks.example.com/support',
            method: 'POST' as const,
            headers: [{ key: 'Authorization', value: 'Bearer secret' }],
            parameters: [{ name: 'ticketId', description: 'Id', type: 'number', required: true }],
            triggerPhrases: ['open ticket'],
            successMessage: 'Ticket created',
            failureMessage: 'Unable to create ticket',
            runAfterCall: false,
        };

        fetchMock
            .mockResolvedValueOnce(jsonResponse({ tools: [existingTool] }))
            .mockResolvedValueOnce(jsonResponse({ success: true }))
            .mockResolvedValueOnce(jsonResponse({ tools: [] }));
        renderModal();

        await user.click(await screen.findByRole('button', { name: /edit/i }));

        expect(screen.getByDisplayValue('Support Ticket')).toBeInTheDocument();
        expect(screen.getByDisplayValue('https://hooks.example.com/support')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Creates support tickets')).toBeInTheDocument();
        expect(screen.getByText(/Authorization/i)).toBeInTheDocument();

    const nameField = screen.getByDisplayValue('Support Ticket');
    await user.clear(nameField);
    await user.type(nameField, ' Support Follow-up ');

    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    await user.click(removeButtons[0]);

        await user.click(screen.getByRole('button', { name: /add header/i }));
        const newHeaderInputs = screen.getAllByPlaceholderText('Header name (e.g., Authorization)');
        const newestHeader = newHeaderInputs[newHeaderInputs.length - 1];
        await user.type(newestHeader, ' X-Custom ');
        const headerValueInputs = screen.getAllByPlaceholderText('Header value');
        await user.type(headerValueInputs[headerValueInputs.length - 1], ' value ');

    const parameterCheckboxes = screen.getAllByLabelText(/Required/i);
    await user.click(parameterCheckboxes[0]);

        await user.click(screen.getByRole('button', { name: /update tool/i }));

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith(
                `/api/agent-tools/${existingTool._id}`,
                expect.objectContaining({ method: 'PUT' }),
            );
        });

        const [, putCall] = fetchMock.mock.calls;
        const updatePayload = JSON.parse(putCall[1]?.body as string);

        expect(updatePayload).toMatchObject({
            name: 'Support Follow-up',
            headers: [{ key: 'X-Custom', value: 'value' }],
            parameters: [{ name: 'ticketId', type: 'number', required: false }],
        });

        expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('prefills missing optional tool fields with safe defaults', async () => {
        const incompleteTool = {
            _id: 'tool-incomplete',
            userId: mockAgent.userId,
            agentId: mockAgent.id,
            name: '',
            webhookUrl: '',
            method: undefined,
            headers: [{}],
            parameters: [{}],
        } as const;

        fetchMock.mockResolvedValueOnce(jsonResponse({ tools: [incompleteTool] }));

        renderModal();

        await user.click(await screen.findByRole('button', { name: /edit/i }));

        const nameInput = screen.getByPlaceholderText('e.g., Create Ticket') as HTMLInputElement;
        expect(nameInput.value).toBe('');

    const methodSelect = screen.getByDisplayValue('POST') as HTMLSelectElement;
        expect(methodSelect.value).toBe('POST');

        const triggerTextarea = screen.getByPlaceholderText('Comma or newline separated phrases that should invoke the tool') as HTMLTextAreaElement;
        expect(triggerTextarea.value).toBe('');

        const successInput = screen.getByPlaceholderText('What should the agent say when the call succeeds?') as HTMLInputElement;
        expect(successInput.value).toBe('');

        const failureInput = screen.getByPlaceholderText('Fallback message if the webhook fails') as HTMLInputElement;
        expect(failureInput.value).toBe('');

        const headerNameInput = screen.getByPlaceholderText('Header name (e.g., Authorization)') as HTMLInputElement;
        expect(headerNameInput.value).toBe('');

        const headerValueInput = screen.getByPlaceholderText('Header value') as HTMLInputElement;
        expect(headerValueInput.value).toBe('');

        const parameterNameInput = screen.getByPlaceholderText('e.g., ticketId') as HTMLInputElement;
        expect(parameterNameInput.value).toBe('');

    const parameterTypeSelect = screen.getByDisplayValue('Text') as HTMLSelectElement;
        expect(parameterTypeSelect.value).toBe('string');

        const parameterDescriptionInput = screen.getByPlaceholderText('Explain what value the agent should capture') as HTMLInputElement;
        expect(parameterDescriptionInput.value).toBe('');

        const parameterRequiredCheckbox = screen.getByLabelText(/Required/i) as HTMLInputElement;
        expect(parameterRequiredCheckbox.checked).toBe(false);

        const runAfterCallCheckbox = screen.getByLabelText(/Run automatically after the call ends/i) as HTMLInputElement;
        expect(runAfterCallCheckbox.checked).toBe(false);
    });

    it('does not delete a tool when confirmation is declined', async () => {
        const existingTool = {
            _id: 'tool-no-delete',
            userId: mockAgent.userId,
            agentId: mockAgent.id,
            name: 'Report Generator',
            webhookUrl: 'https://hooks.example.com/report',
            method: 'GET' as const,
        };

        fetchMock.mockResolvedValueOnce(jsonResponse({ tools: [existingTool] }));
        confirmSpy.mockReturnValue(false);
        renderModal();

        await user.click(await screen.findByRole('button', { name: /delete/i }));

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('deletes a tool when confirmation is accepted', async () => {
        const existingTool = {
            _id: 'tool-delete',
            userId: mockAgent.userId,
            agentId: mockAgent.id,
            name: 'Follow-up Sender',
            webhookUrl: 'https://hooks.example.com/follow-up',
            method: 'POST' as const,
        };

        fetchMock
            .mockResolvedValueOnce(jsonResponse({ tools: [existingTool] }))
            .mockResolvedValueOnce(jsonResponse({}, true))
            .mockResolvedValueOnce(jsonResponse({ tools: [] }));

        renderModal();

        await user.click(await screen.findByRole('button', { name: /delete/i }));

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith(
                `/api/agent-tools/${existingTool._id}`,
                expect.objectContaining({ method: 'DELETE' }),
            );
        });

        expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('alerts when removing a tool fails', async () => {
        const existingTool = {
            _id: 'tool-failed-delete',
            userId: mockAgent.userId,
            agentId: mockAgent.id,
            name: 'Sync Tool',
            webhookUrl: 'https://hooks.example.com/sync',
            method: 'POST' as const,
        };

        fetchMock
            .mockResolvedValueOnce(jsonResponse({ tools: [existingTool] }))
            .mockResolvedValueOnce({
                ok: false,
                json: async () => ({ error: 'Failed to delete tool' }),
            } as Response);

        renderModal();

        await user.click(await screen.findByRole('button', { name: /delete/i }));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Failed to delete tool');
        });

        expect(fetchMock).toHaveBeenCalledTimes(2);
    });
});
