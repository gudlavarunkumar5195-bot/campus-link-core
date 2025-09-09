/**
 * Billing Provider Stub - Placeholder for future billing integration
 * 
 * This file contains a stub implementation of a billing provider interface.
 * When you're ready to enable billing, implement this interface with your
 * chosen billing provider (Stripe, Paddle, LemonSqueezy, etc.)
 * 
 * IMPORTANT: This is a NO-OP implementation. All methods throw errors
 * to prevent accidental use in production before billing is properly implemented.
 */

export interface BillingProvider {
  // Customer management
  createCustomer(params: CreateCustomerParams): Promise<BillingCustomer>;
  updateCustomer(customerId: string, params: UpdateCustomerParams): Promise<BillingCustomer>;
  deleteCustomer(customerId: string): Promise<void>;

  // Subscription management
  createSubscription(params: CreateSubscriptionParams): Promise<BillingSubscription>;
  updateSubscription(subscriptionId: string, params: UpdateSubscriptionParams): Promise<BillingSubscription>;
  cancelSubscription(subscriptionId: string, params?: CancelSubscriptionParams): Promise<BillingSubscription>;
  pauseSubscription(subscriptionId: string): Promise<BillingSubscription>;
  resumeSubscription(subscriptionId: string): Promise<BillingSubscription>;

  // Payment method management
  createPaymentMethod(customerId: string, params: CreatePaymentMethodParams): Promise<BillingPaymentMethod>;
  updatePaymentMethod(paymentMethodId: string, params: UpdatePaymentMethodParams): Promise<BillingPaymentMethod>;
  deletePaymentMethod(paymentMethodId: string): Promise<void>;

  // Invoice management
  getInvoices(customerId: string, params?: GetInvoicesParams): Promise<BillingInvoice[]>;
  getUpcomingInvoice(subscriptionId: string): Promise<BillingInvoice>;

  // Webhook handling
  handleWebhookEvent(event: WebhookEvent): Promise<void>;

  // Portal/checkout URLs
  createCheckoutSession(params: CreateCheckoutParams): Promise<{ url: string }>;
  createPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }>;
}

// Type definitions for billing entities
export interface BillingCustomer {
  id: string;
  email: string;
  name?: string;
  metadata?: Record<string, any>;
  created: Date;
}

export interface BillingSubscription {
  id: string;
  customerId: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'paused' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  canceledAt?: Date;
  metadata?: Record<string, any>;
}

export interface BillingPaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'other';
  last4?: string;
  brand?: string;
  isDefault: boolean;
}

export interface BillingInvoice {
  id: string;
  customerId: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  dueDate?: Date;
  paidAt?: Date;
  hostedInvoiceUrl?: string;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  created: Date;
}

// Parameter types
export interface CreateCustomerParams {
  email: string;
  name?: string;
  organizationId: string;
  metadata?: Record<string, any>;
}

export interface UpdateCustomerParams {
  email?: string;
  name?: string;
  metadata?: Record<string, any>;
}

export interface CreateSubscriptionParams {
  customerId: string;
  planId: string;
  trialDays?: number;
  metadata?: Record<string, any>;
}

export interface UpdateSubscriptionParams {
  planId?: string;
  metadata?: Record<string, any>;
}

export interface CancelSubscriptionParams {
  immediately?: boolean;
  reason?: string;
}

export interface CreatePaymentMethodParams {
  type: string;
  token?: string;
  metadata?: Record<string, any>;
}

export interface UpdatePaymentMethodParams {
  isDefault?: boolean;
  metadata?: Record<string, any>;
}

export interface GetInvoicesParams {
  limit?: number;
  status?: string;
}

export interface CreateCheckoutParams {
  customerId?: string;
  planId: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
  metadata?: Record<string, any>;
}

/**
 * STUB IMPLEMENTATION - DO NOT USE IN PRODUCTION
 * 
 * This class provides placeholder implementations that throw errors.
 * Replace this with a real billing provider implementation when ready.
 */
export class BillingProviderStub implements BillingProvider {
  constructor(private config: { apiKey: string; webhookSecret?: string }) {
    console.warn('⚠️ Using BillingProviderStub - billing functionality is disabled');
  }

  async createCustomer(params: CreateCustomerParams): Promise<BillingCustomer> {
    throw new Error('Billing not implemented: createCustomer() - Please implement a real billing provider');
    
    // Example Stripe implementation:
    // const customer = await this.stripe.customers.create({
    //   email: params.email,
    //   name: params.name,
    //   metadata: { ...params.metadata, organization_id: params.organizationId }
    // });
    // return this.mapStripeCustomer(customer);
  }

  async updateCustomer(customerId: string, params: UpdateCustomerParams): Promise<BillingCustomer> {
    throw new Error('Billing not implemented: updateCustomer() - Please implement a real billing provider');
  }

  async deleteCustomer(customerId: string): Promise<void> {
    throw new Error('Billing not implemented: deleteCustomer() - Please implement a real billing provider');
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<BillingSubscription> {
    throw new Error('Billing not implemented: createSubscription() - Please implement a real billing provider');
    
    // Example Stripe implementation:
    // const subscription = await this.stripe.subscriptions.create({
    //   customer: params.customerId,
    //   items: [{ price: params.planId }],
    //   trial_period_days: params.trialDays,
    //   metadata: params.metadata
    // });
    // return this.mapStripeSubscription(subscription);
  }

  async updateSubscription(subscriptionId: string, params: UpdateSubscriptionParams): Promise<BillingSubscription> {
    throw new Error('Billing not implemented: updateSubscription() - Please implement a real billing provider');
  }

  async cancelSubscription(subscriptionId: string, params?: CancelSubscriptionParams): Promise<BillingSubscription> {
    throw new Error('Billing not implemented: cancelSubscription() - Please implement a real billing provider');
  }

  async pauseSubscription(subscriptionId: string): Promise<BillingSubscription> {
    throw new Error('Billing not implemented: pauseSubscription() - Please implement a real billing provider');
  }

  async resumeSubscription(subscriptionId: string): Promise<BillingSubscription> {
    throw new Error('Billing not implemented: resumeSubscription() - Please implement a real billing provider');
  }

  async createPaymentMethod(customerId: string, params: CreatePaymentMethodParams): Promise<BillingPaymentMethod> {
    throw new Error('Billing not implemented: createPaymentMethod() - Please implement a real billing provider');
  }

  async updatePaymentMethod(paymentMethodId: string, params: UpdatePaymentMethodParams): Promise<BillingPaymentMethod> {
    throw new Error('Billing not implemented: updatePaymentMethod() - Please implement a real billing provider');
  }

  async deletePaymentMethod(paymentMethodId: string): Promise<void> {
    throw new Error('Billing not implemented: deletePaymentMethod() - Please implement a real billing provider');
  }

  async getInvoices(customerId: string, params?: GetInvoicesParams): Promise<BillingInvoice[]> {
    throw new Error('Billing not implemented: getInvoices() - Please implement a real billing provider');
  }

  async getUpcomingInvoice(subscriptionId: string): Promise<BillingInvoice> {
    throw new Error('Billing not implemented: getUpcomingInvoice() - Please implement a real billing provider');
  }

  async handleWebhookEvent(event: WebhookEvent): Promise<void> {
    throw new Error('Billing not implemented: handleWebhookEvent() - Please implement a real billing provider');
    
    // Example webhook handling:
    // switch (event.type) {
    //   case 'customer.subscription.updated':
    //     await this.handleSubscriptionUpdated(event.data);
    //     break;
    //   case 'invoice.payment_succeeded':
    //     await this.handlePaymentSucceeded(event.data);
    //     break;
    //   default:
    //     console.log(`Unhandled webhook event: ${event.type}`);
    // }
  }

  async createCheckoutSession(params: CreateCheckoutParams): Promise<{ url: string }> {
    throw new Error('Billing not implemented: createCheckoutSession() - Please implement a real billing provider');
    
    // Example Stripe implementation:
    // const session = await this.stripe.checkout.sessions.create({
    //   customer: params.customerId,
    //   line_items: [{ price: params.planId, quantity: 1 }],
    //   mode: 'subscription',
    //   success_url: params.successUrl,
    //   cancel_url: params.cancelUrl,
    //   subscription_data: {
    //     trial_period_days: params.trialDays,
    //     metadata: params.metadata
    //   }
    // });
    // return { url: session.url! };
  }

  async createPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }> {
    throw new Error('Billing not implemented: createPortalSession() - Please implement a real billing provider');
    
    // Example Stripe implementation:
    // const session = await this.stripe.billingPortal.sessions.create({
    //   customer: customerId,
    //   return_url: returnUrl
    // });
    // return { url: session.url };
  }
}

/**
 * Factory function to create billing provider instance
 * Replace this with your chosen provider when ready
 */
export const createBillingProvider = (config: { apiKey: string; webhookSecret?: string }): BillingProvider => {
  // When ready to implement billing, replace with:
  // return new StripeBillingProvider(config);
  // return new PaddleBillingProvider(config);
  // return new LemonSqueezyBillingProvider(config);
  
  return new BillingProviderStub(config);
};

/**
 * TO ENABLE BILLING:
 * 
 * 1. Choose your billing provider (Stripe, Paddle, LemonSqueezy, etc.)
 * 
 * 2. Install the provider's SDK:
 *    npm install stripe
 *    npm install @paddlehq/paddle-js
 *    npm install @lemonsqueezy/sdk
 * 
 * 3. Implement the BillingProvider interface:
 *    - Create src/lib/billing/stripe.ts (or paddle.ts, etc.)
 *    - Implement all interface methods
 *    - Handle webhook events properly
 * 
 * 4. Update the factory function above to return your implementation
 * 
 * 5. Set up environment variables:
 *    STRIPE_SECRET_KEY=sk_test_...
 *    STRIPE_WEBHOOK_SECRET=whsec_...
 * 
 * 6. Update provider_mappings table with actual provider IDs
 * 
 * 7. Set up webhook endpoints in your provider dashboard
 * 
 * 8. Test thoroughly in development before production
 * 
 * See README-billing.md for detailed instructions
 */