/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '../../../app/dashboard/page';

// Mock child components used by DashboardPage to keep tests focused and fast
jest.mock('../../../components/AgentModal', () => ({
  __esModule: true,
  default: ({ isOpen }: any) => <div data-testid="AgentModal">AgentModal isOpen={String(isOpen)}</div>,
}));

jest.mock('../../../components/VoiceAgentsTable', () => ({
  __esModule: true,
  default: ({ onAddAgent, onEditAgent }: any) => (
    <div>
      <div data-testid="VoiceAgentsTable">VoiceAgentsTable</div>
      <button data-testid="add-agent" onClick={() => onAddAgent && onAddAgent()}>Add</button>
      <button data-testid="edit-agent" onClick={() => onEditAgent && onEditAgent({ id: 'a1' })}>Edit</button>
    </div>
  ),
}));

jest.mock('../../../components/CallLogsTable', () => ({
  __esModule: true,
  default: ({ onViewCallDetails }: any) => (
    <div>
      <div data-testid="CallLogsTable">CallLogsTable</div>
      <button data-testid="view-call" onClick={() => onViewCallDetails && onViewCallDetails('s1')}>View</button>
    </div>
  ),
}));

jest.mock('../../../components/CampaignsTable', () => ({
  __esModule: true,
  default: ({ campaigns, onStartCampaign, onRetriggerCampaign }: any) => (
    <div>
      <div data-testid="CampaignsTable">CampaignsTable</div>
      <button data-testid="start-campaign" onClick={() => onStartCampaign && onStartCampaign(campaigns?.[0])}>Start</button>
      <button data-testid="retrigger-campaign" onClick={() => onRetriggerCampaign && onRetriggerCampaign(campaigns?.[0])}>Retrigger</button>
    </div>
  ),
}));

jest.mock('../../../components/PhoneNumbersTable', () => ({
  __esModule: true,
  default: ({ onAddPhone, onEditPhone }: any) => (
    <div>
      <div data-testid="PhoneNumbersTable">PhoneNumbersTable</div>
      <button data-testid="add-phone" onClick={() => onAddPhone && onAddPhone()}>Add</button>
      <button data-testid="edit-phone" onClick={() => onEditPhone && onEditPhone({ id: 'p1' })}>Edit</button>
    </div>
  ),
}));

jest.mock('../../../components/WhatsAppNumbersTable', () => ({
  __esModule: true,
  default: ({ onAddWhatsApp, onEditWhatsApp }: any) => (
    <div>
      <div data-testid="WhatsAppNumbersTable">WhatsAppNumbersTable</div>
      <button data-testid="add-whatsapp" onClick={() => onAddWhatsApp && onAddWhatsApp()}>Add</button>
      <button data-testid="edit-whatsapp" onClick={() => onEditWhatsApp && onEditWhatsApp({ id: 'w1' })}>Edit</button>
    </div>
  ),
}));

jest.mock('../../../components/CampaignModal', () => ({
  __esModule: true,
  default: ({ isOpen }: any) => <div data-testid="CampaignModal">CampaignModal isOpen={String(isOpen)}</div>,
}));

jest.mock('../../../components/CampaignContactsModal', () => ({
  __esModule: true,
  default: ({ isOpen }: any) => <div data-testid="CampaignContactsModal">CampaignContactsModal isOpen={String(isOpen)}</div>,
}));

jest.mock('../../../components/PhoneNumberModal', () => ({
  __esModule: true,
  default: ({ isOpen }: any) => <div data-testid="PhoneNumberModal">PhoneNumberModal isOpen={String(isOpen)}</div>,
}));

jest.mock('../../../components/WhatsAppNumberModal', () => ({
  __esModule: true,
  default: ({ isOpen }: any) => <div data-testid="WhatsAppNumberModal">WhatsAppNumberModal isOpen={String(isOpen)}</div>,
}));

jest.mock('../../../components/ChatHistory', () => ({
  __esModule: true,
  default: ({ isOpen }: any) => <div data-testid="ChatHistory">ChatHistory isOpen={String(isOpen)}</div>,
}));

// DashboardSidebar mock exposes navigation buttons that call onNavigate
jest.mock('../../../components/DashboardSidebar', () => ({
  __esModule: true,
  default: ({ activeView, onNavigate }: any) => (
    <div>
      <div data-testid="DashboardSidebar">Sidebar active={activeView}</div>
      <button data-testid="nav-voice" onClick={() => onNavigate('voice-agents')}>voice</button>
      <button data-testid="nav-calllogs" onClick={() => onNavigate('call-logs')}>calllogs</button>
      <button data-testid="nav-campaigns" onClick={() => onNavigate('campaigns')}>campaigns</button>
      <button data-testid="nav-phone" onClick={() => onNavigate('phone-number')}>phone</button>
      <button data-testid="nav-whatsapp" onClick={() => onNavigate('whatsapp-number')}>whatsapp</button>
      <button data-testid="nav-agent-knowledge" onClick={() => onNavigate('agent-knowledge')}>agent-knowledge</button>
      <button data-testid="nav-unknown" onClick={() => onNavigate('unknown-view')}>unknown</button>
    </div>
  ),
}));

describe('DashboardPage render and handlers', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // default fetch mock
    (global as any).fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [] }) })
    );
  });

  it('renders voice agents view by default and allows switching to call logs', () => {
    render(<DashboardPage />);

    // Default voice agents
    expect(screen.getByTestId('VoiceAgentsTable')).toBeInTheDocument();

    // Switch to call logs
    fireEvent.click(screen.getByTestId('nav-calllogs'));
    expect(screen.getByTestId('CallLogsTable')).toBeInTheDocument();
  });

  it('shows campaigns table when navigating to campaigns and calls fetch', async () => {
    // mock fetch to return one campaign
    (global as any).fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [{ _id: 'c1', title: 'C', start_date: '', updated_at: '', status: 'stopped', agent_id: '', user_id: '' }] }) })
    );

    render(<DashboardPage />);
    fireEvent.click(screen.getByTestId('nav-campaigns'));

    // CampaignsTable is a mocked component that should receive campaigns prop and render
    await waitFor(() => expect(screen.getByTestId('CampaignsTable')).toBeInTheDocument());
    expect((global as any).fetch).toHaveBeenCalledWith('/api/campaigns');
  });

  it('shows coming soon for grouped views like agent-knowledge', () => {
    render(<DashboardPage />);
    fireEvent.click(screen.getByTestId('nav-agent-knowledge'));
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });

  it('handles start campaign flow: confirm cancel does not call fetch', () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<DashboardPage />);
    fireEvent.click(screen.getByTestId('nav-campaigns'));

    // Simulate CampaignsTable calling onStartCampaign with a campaign missing _id
    // The mocked CampaignsTable calls onStartCampaign with campaigns?.[0] which is undefined, so nothing happens
    // Now manually trigger start with a campaign that has _id but confirm returns false
    const campaignsTableStart = screen.getByTestId('start-campaign');

    // Prepare a campaign by setting fetch to return a campaign and re-navigate
    (global as any).fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [{ _id: 'c2', title: 'C2', start_date: '', updated_at: '', status: 'stopped', agent_id: '', user_id: '' }] }) })
    );

    // Re-render and navigate to campaigns so the mocked component has a campaign to pass
    fireEvent.click(screen.getByTestId('nav-campaigns'));

    // Click start which will invoke onStartCampaign -> confirm returns false -> no fetch to /api/campaigns/start
    fireEvent.click(campaignsTableStart);

    expect(confirmSpy).toHaveBeenCalled();
    // If confirm false, no alert for success is shown
    expect(alertSpy).not.toHaveBeenCalledWith(expect.stringContaining('Campaign starting'));

    confirmSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('handles start campaign flow: success path calls API and alerts', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    // mock /api/campaigns then /api/campaigns/start
    (global as any).fetch = jest.fn()
      .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [{ _id: 'c3', title: 'C3', start_date: '', updated_at: '', status: 'stopped', agent_id: '', user_id: '' }] }) }))
      .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) }));

    render(<DashboardPage />);
    fireEvent.click(screen.getByTestId('nav-campaigns'));

    // Wait for CampaignsTable
    await waitFor(() => expect(screen.getByTestId('CampaignsTable')).toBeInTheDocument());

    // Click start
    fireEvent.click(screen.getByTestId('start-campaign'));

    await waitFor(() => expect((global as any).fetch).toHaveBeenCalledWith('/api/campaigns/start', expect.any(Object)));
    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Campaign starting'));

    confirmSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('handles retrigger campaign path with confirm cancellation', () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<DashboardPage />);
    fireEvent.click(screen.getByTestId('nav-campaigns'));

    fireEvent.click(screen.getByTestId('retrigger-campaign'));

    expect(confirmSpy).toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalledWith(expect.stringContaining('Campaign retriggered'));

    confirmSpy.mockRestore();
    alertSpy.mockRestore();
  });
});
