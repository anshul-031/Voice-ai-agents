// TypeScript interfaces for MetaMessageRequest and MetaMessageResponse
export interface MetaMessageRequest {
    messaging_product: string;
    recipient_type: string;
    to: string;
    type: string;
    text?: MetaTextMessageRequest;
    image?: MetaImageMessageRequest;
    interactive?: MetaInteractiveMessageRequest;
    template?: MetaTemplateMessageRequest;
}

export interface MetaTextMessageRequest {
    preview_url?: boolean;
    body: string;
}
export interface MetaImageMessageRequest {
    id?: string;
    link: string;
    caption?: string;
}
export interface MetaInteractiveMessageRequest {
    type: string;
    header?: InteractiveMessageHeader;
    body?: InteractiveMessageBody;
    footer?: InteractiveMessageFooter;
    action?: InteractiveMessageAction;
}

export interface InteractiveMessageHeader {
    type: string;
    text?: string;
    image?: InteractiveMessageImage;
}

export interface InteractiveMessageImage {
    link: string;
}

export interface InteractiveMessageBody {
    text: string;
}

export interface InteractiveMessageFooter {
    text: string;
}

export interface InteractiveMessageAction {
    name?: string;
    button?: string;
    buttons?: InteractiveMessageButton[];
    sections?: InteractiveMessageSection[];
    parameters?: InteractiveMessageParameter;
}

export interface InteractiveMessageButton {
    type: string;
    reply?: InteractiveMessageReply;
}

export interface InteractiveMessageReply {
    id: string;
    title: string;
}

export interface InteractiveMessageSection {
    title?: string;
    rows?: InteractiveMessageRow[];
}

export interface InteractiveMessageRow {
    id: string;
    title: string;
    description?: string;
}

export interface InteractiveMessageParameter {
    displayText?: string;
    url?: string;
}
export interface MetaTemplateMessageRequest {
    name: string;
    language: TemplateMessageLanguage;
    components: Component[];
}

export interface TemplateMessageLanguage {
    code: string;
}

export interface Component {
    type: string;
    parameters: Parameter[];
}

export interface Parameter {
    type: string;
    text?: string;
    image?: Image;
}

export interface Image {
    link: string;
}

export interface MetaMessageResponse {
    messaging_product: string;
    contacts: Array<{
        input: string;
        wa_id: string;
    }>;
    messages: Array<{
        id: string;
        message_status: string;
    }>;
}

/**
 * Sends a message to the Meta WhatsApp API.
 * @param metaMessageRequest The message request object
 * @returns The parsed MetaMessageResponse or null on error
 */
export async function sendMessage(metaMessageRequest: MetaMessageRequest): Promise<MetaMessageResponse | null> {
    console.info('Entering sendMessage method');
    try {
        const url = process.env.NEXT_PUBLIC_META_WHATSAPP_API_URL;
        const token = process.env.NEXT_PUBLIC_META_WHATSAPP_API_TOKEN;
        if (!url || !token) {
            console.error('Meta WhatsApp API URL or Token is not set in environment variables');
            return null;
        }
        console.info("Meta WhatsApp API URL:", url);
        console.info("Meta WhatsApp API Token:", token);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(metaMessageRequest),
        });
            console.info("Meta API CALL FINISHEDL");
            console.warn("Meta API CALL FINISHEDL");
        if (!response.ok) {
            const errorText = await response.text();
            console.info('Error in sendMessage:', response.status, errorText);
            console.error('Error in sendMessage:', response.status, errorText);
            console.warn('Error in sendMessage:', response.status, errorText);
            return null;
        }
        const metaResponse = await response.json();
        if (metaResponse.response) {
            console.info('MetaMessageResponse with response field:', metaResponse.response);
            console.warn('MetaMessageResponse with response field:', metaResponse.response);
            return metaResponse.response as MetaMessageResponse;
        }
        return metaResponse as MetaMessageResponse;
    } catch (e: any) {
        console.error('Exception in sendMessage', e?.message);
        return null;
    }
}

/**
 * Builds a MetaMessageRequest object for WhatsApp API
 * @param mobileNo - recipient's mobile number
 * @param message - message body
 * @returns MetaMessageRequest object
 */
function getMetaMessageRequest(mobileNo: string, message: string): MetaMessageRequest {
    return {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: mobileNo,
        type: "text",
        text: {
            preview_url: false,
            body: message
        }
    };
}

/**
 * Sends a WhatsApp text message to the given mobile number.
 * @param mobileNo - recipient's mobile number
 * @param message - message body
 * @returns MetaMessageResponse or null on error
 */
export async function sendTextMessage(mobileNo: string, message: string): Promise<MetaMessageResponse | null> {
    const request = getMetaMessageRequest(mobileNo, message);
    console.info('MetaMessageRequest:', request);
    return await sendMessage(request);
}
/**
 * Processes WhatsApp webhook callback and extracts user phone number and message.
 * @param callbackResponse The parsed webhook JSON object
 */
export function processWhatsAppCallback(callbackResponse: any): void {
    try {
        const entry = callbackResponse?.entry?.[0];
        const change = entry?.changes?.[0];
        const value = change?.value;
        const message = value?.messages?.[0];
        const userMobile = message?.from;
        const userMessage = message?.text?.body;

        // Example: Log extracted values
        console.info('User Mobile (from):', userMobile);
        console.info('User Message:', userMessage);
        if(userMessage && userMobile){
            sendTextMessage(userMobile, userMessage);
        }

        // Add further processing logic here if needed
    } catch (e) {
        console.error('Error processing WhatsApp callback:', e);
    }
}