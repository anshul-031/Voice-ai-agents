import AgentModal from '@/components/AgentModal';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

describe('AgentModal knowledge management', () => {
    let fetchMock: jest.MockedFunction<typeof fetch>;
    let alertSpy: jest.SpyInstance;
    let user: ReturnType<typeof userEvent.setup>;
    let originalFetch: typeof fetch;
    let originalFileReader: typeof FileReader;

    type FileReaderConfig = {
        result: unknown;
        shouldError?: boolean;
    };

    let fileReaderConfig: FileReaderConfig;

    class MockFileReader {
        public result: unknown = null;
        public onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
        public onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;

        readAsText() {
            if (fileReaderConfig.shouldError) {
                this.onerror?.({} as ProgressEvent<FileReader>);
                return;
            }

            this.result = fileReaderConfig.result;
            this.onload?.({} as ProgressEvent<FileReader>);
        }
    }

    const renderModal = () => render(
        <AgentModal
            isOpen
            onClose={jest.fn()}
            agent={mockAgent as never}
            onSuccess={jest.fn()}
        />,
    );

    beforeEach(() => {
        originalFetch = global.fetch;
        fetchMock = jest.fn().mockResolvedValue(jsonResponse({ tools: [] }));
        global.fetch = fetchMock;

        alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => undefined);
        user = userEvent.setup({ delay: 0 });

        fileReaderConfig = { result: 'Example content', shouldError: false };
        originalFileReader = global.FileReader;
        global.FileReader = jest.fn(() => new MockFileReader()) as unknown as typeof FileReader;
    });

    afterEach(() => {
        global.fetch = originalFetch;
        alertSpy.mockRestore();
        global.FileReader = originalFileReader;
        jest.resetAllMocks();
    });

    it('alerts when uploading an unsupported file type', async () => {
        renderModal();

        const fileInput = screen.getByLabelText('Upload file (CSV or TXT)');
        const file = new File(['data'], 'notes.pdf', { type: 'application/pdf' });

        fireEvent.change(fileInput, { target: { files: [file] } });

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Only CSV and TXT files are supported.');
        });

        expect(fetchMock).toHaveBeenCalledWith('/api/agent-tools?agentId=agent-123');
    });

    it('alerts when the uploaded file exceeds the size limit', async () => {
        renderModal();

        const fileInput = screen.getByLabelText('Upload file (CSV or TXT)');
        const oversized = new File([new Uint8Array(3 * 1024 * 1024)], 'large.csv', { type: 'text/csv' });

        fireEvent.change(fileInput, { target: { files: [oversized] } });

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('File size exceeds 2 MB limit.');
        });
    });

    it('alerts when the file reader returns a non-string result', async () => {
        fileReaderConfig.result = 42;
        renderModal();

        const fileInput = screen.getByLabelText('Upload file (CSV or TXT)');
        const file = new File(['data'], 'valid.csv', { type: 'text/csv' });

        fireEvent.change(fileInput, { target: { files: [file] } });

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Unable to read file content.');
        });
    });

    it('alerts when reading the file fails', async () => {
        fileReaderConfig.shouldError = true;
        renderModal();

        const fileInput = screen.getByLabelText('Upload file (CSV or TXT)');
        const file = new File(['data'], 'valid.csv', { type: 'text/csv' });

        fireEvent.change(fileInput, { target: { files: [file] } });

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Failed to read the file. Please try again.');
        });
    });

    it('falls back to timestamp-based ids when crypto.randomUUID is unavailable', async () => {
        const originalDescriptor = Object.getOwnPropertyDescriptor(global, 'crypto');
        Object.defineProperty(global, 'crypto', {
            value: {},
            configurable: true,
        });

        try {
            renderModal();

            const manualKnowledge = screen.getByPlaceholderText('Paste important FAQs, policy snippets, or canned responses...');
            await user.type(manualKnowledge, 'Timestamp note');
            await user.click(screen.getByRole('button', { name: /add to knowledge/i }));

            await waitFor(() => {
                expect(screen.getByText('Knowledge entries (1)')).toBeInTheDocument();
            });

            expect(screen.getByText(/Manual Note 1/)).toBeInTheDocument();
        } finally {
            if (originalDescriptor) {
                Object.defineProperty(global, 'crypto', originalDescriptor);
            }
        }
    });

    it('handles zero-byte knowledge files and displays 0 B total size', async () => {
        fileReaderConfig.result = '';
        renderModal();

        const fileInput = screen.getByLabelText('Upload file (CSV or TXT)');
        const emptyFile = new File([''], 'empty.txt', { type: 'text/plain' });

        fireEvent.change(fileInput, { target: { files: [emptyFile] } });

        await waitFor(() => {
            expect(screen.getByText('Knowledge entries (1)')).toBeInTheDocument();
            expect(screen.getByText('Total size: 0 B')).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: /remove/i }));

        await waitFor(() => {
            expect(screen.getByText(/No knowledge entries yet/)).toBeInTheDocument();
        });
    });

    it('manages knowledge items for successful uploads and manual notes', async () => {
        const largeContent = 'x'.repeat(1_600_000);
        fileReaderConfig.result = largeContent;
        renderModal();

        const fileInput = screen.getByLabelText('Upload file (CSV or TXT)');
        const file = new File([largeContent], 'context.csv', { type: 'text/csv' });

        fireEvent.change(fileInput, { target: { files: [file] } });

        await waitFor(() => {
            expect(screen.getByText('Knowledge entries (1)')).toBeInTheDocument();
        });

        const expectedMb = ((file.size / 1024) / 1024).toFixed(2);
        expect(screen.getByText(`Total size: ${expectedMb} MB`)).toBeInTheDocument();

        const manualKnowledge = screen.getByPlaceholderText('Paste important FAQs, policy snippets, or canned responses...');
        await user.type(manualKnowledge, 'Helpful note');
        await user.click(screen.getByRole('button', { name: /add to knowledge/i }));

        await waitFor(() => {
            expect(screen.getByText('Knowledge entries (2)')).toBeInTheDocument();
        });

        const removeButtons = screen.getAllByRole('button', { name: /remove/i });
        await user.click(removeButtons[0]);

        await waitFor(() => {
            expect(screen.getByText(/Knowledge entries \(1\)/)).toBeInTheDocument();
            expect(screen.getByText(/Total size: 0.0 KB/)).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: /remove/i }));

        await waitFor(() => {
            expect(screen.getByText(/No knowledge entries yet/)).toBeInTheDocument();
        });

        expect(manualKnowledge).toHaveValue('');
    });
});
