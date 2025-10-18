/**
 * Exotel API Integration Module
 * Handles outbound calling via Exotel API
 */

// Exotel configuration helper to ensure we always reflect the latest env values
function getExotelConfig() {
  const normalize = (value?: string | null) => (value ?? '').trim();

  return {
    authKey: normalize(process.env.EXOTEL_AUTH_KEY),
    authToken: normalize(process.env.EXOTEL_AUTH_TOKEN),
    subdomain: normalize(process.env.EXOTEL_SUBDOMAIN),
    accountSid: normalize(process.env.EXOTEL_ACCOUNT_SID),
    callerId: normalize(process.env.EXOTEL_CALLER_ID),
    url: normalize(process.env.EXOTEL_URL)
  };
}

export interface ExotelCallParams {
  phoneNumber: string; // 10-digit phone number
  contactName?: string;
  contactId?: string;
}

export interface ExotelCallResponse {
  success: boolean;
  callSid?: string;
  status?: string;
  error?: string;
  phoneNumber: string;
}

/**
 * Formats phone number to Exotel format (91 + 10 digits)
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove any non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // If already starts with 91, return as is
  if (digits.startsWith('91') && digits.length === 12) {
    return digits;
  }
  
  // If 10 digits, add 91 prefix
  if (digits.length === 10) {
    return `91${digits}`;
  }
  
  // If 11 digits and starts with 0, remove 0 and add 91
  if (digits.length === 11 && digits.startsWith('0')) {
    return `91${digits.substring(1)}`;
  }
  
  // Return as is if already in correct format
  return digits;
}

/**
 * Triggers an outbound call via Exotel API
 */
export async function triggerExotelCall(params: ExotelCallParams): Promise<ExotelCallResponse> {
  try {
    const config = getExotelConfig();
    const formattedNumber = formatPhoneNumber(params.phoneNumber);
    
    // Validate phone number format
    if (!formattedNumber || formattedNumber.length !== 12) {
      return {
        success: false,
        error: `Invalid phone number format: ${params.phoneNumber}`,
        phoneNumber: params.phoneNumber
      };
    }

    // Prepare authentication header
  const authString = Buffer.from(`${config.authKey}:${config.authToken}`).toString('base64');
    
    // Prepare API endpoint
  const apiUrl = `https://${config.subdomain}/v1/Accounts/${config.accountSid}/Calls/connect.json`;
    
    // Prepare request body
    const formData = new URLSearchParams();
    formData.append('From', formattedNumber);
  formData.append('CallerId', config.callerId);
  formData.append('Url', config.url);
    
    // Make API request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });

    const responseData = await response.json();

    if (response.ok && responseData.Call) {
      return {
        success: true,
        callSid: responseData.Call.Sid,
        status: responseData.Call.Status,
        phoneNumber: params.phoneNumber
      };
    } else {
      return {
        success: false,
        error: responseData.RestException?.Message || responseData.message || 'Failed to initiate call',
        phoneNumber: params.phoneNumber
      };
    }
  } catch (error: any) {
    console.error('Exotel API Error:', error);
    return {
      success: false,
      error: error.message || 'Network error while calling Exotel API',
      phoneNumber: params.phoneNumber
    };
  }
}

/**
 * Triggers multiple calls with delay between each call
 */
export async function triggerBulkCalls(
  contacts: ExotelCallParams[],
  onProgress?: (completed: number, total: number, result: ExotelCallResponse) => void,
  delayMs: number = 2000 // 2 second delay between calls
): Promise<ExotelCallResponse[]> {
  const results: ExotelCallResponse[] = [];
  
  for (let i = 0; i < contacts.length; i++) {
    const result = await triggerExotelCall(contacts[i]);
    results.push(result);
    
    // Call progress callback
    if (onProgress) {
      onProgress(i + 1, contacts.length, result);
    }
    
    // Add delay between calls (except after the last call)
    if (i < contacts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}

/**
 * Validates Exotel configuration
 */
export function validateExotelConfig(): { valid: boolean; errors: string[] } {
  const config = getExotelConfig();
  const errors: string[] = [];
  
  if (!config.authKey) {
    errors.push('EXOTEL_AUTH_KEY is missing');
  }
  
  if (!config.authToken) {
    errors.push('EXOTEL_AUTH_TOKEN is missing');
  }
  
  if (!config.accountSid) {
    errors.push('EXOTEL_ACCOUNT_SID is missing');
  }
  
  if (!config.callerId) {
    errors.push('EXOTEL_CALLER_ID is missing');
  }
  
  if (!config.url) {
    errors.push('EXOTEL_URL is missing');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
