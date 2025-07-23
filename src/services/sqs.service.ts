import { Injectable, OnModuleInit } from '@nestjs/common';
import { SQS } from 'aws-sdk';
import { config } from 'dotenv';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
config();
@Injectable()
export class SqsService implements OnModuleInit {
  private sqs: SQS;
  private readonly queueUrls = {
    users: process.env.USERS_QUEUE_URL || 'https://sqs.us-east-1.amazonaws.com/account/users-queue',
    orders: process.env.ORDERS_QUEUE_URL || 'https://sqs.us-east-1.amazonaws.com/account/orders-queue',
    responses: process.env.RESPONSE_QUEUE_URL || 'https://sqs.us-east-1.amazonaws.com/account/response-queue'
  };

  // Store pending requests with promises
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timeout: NodeJS.Timeout;
  }>();

  constructor(private readonly httpService: HttpService) {
    this.sqs = new SQS({
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });
  }

  onModuleInit() {
    // Start polling for responses when service initializes
    this.startResponsePolling();
  }

  async publishEventAndWaitForResponse(
    service: 'users' | 'orders', 
    event: any, 
    timeoutMs: number = 30000
  ): Promise<any> {
       await lastValueFrom(this.httpService.get('https://users-service-umber.vercel.app/health'));
    const params = {
      QueueUrl: this.queueUrls[service],
      MessageBody: JSON.stringify(event),
      MessageAttributes: {
        eventType: {
          DataType: 'String',
          StringValue: event.type
        },
        correlationId: {
          DataType: 'String',
          StringValue: event.correlationId
        },
        replyTo: {
          DataType: 'String',
          StringValue: this.queueUrls.responses
        }
      }
    };

    try {
      // Send the message to service queue
      await this.sqs.sendMessage(params).promise();
      console.log(`Event published to ${service} queue:`, event);

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.pendingRequests.delete(event.correlationId);
          reject(new Error('Request timeout - no response received within ' + timeoutMs + 'ms'));
        }, timeoutMs);

        this.pendingRequests.set(event.correlationId, {
          resolve,
          reject,
          timeout
        });
      });

    } catch (error) {
      console.error(`Error publishing to ${service} queue:`, error);
      throw error;
    }
  }

  // Start polling for responses from services
  private async startResponsePolling() {
    console.log('Starting response polling...');
    
    while (true) {
      try {
        const params = {
          QueueUrl: this.queueUrls.responses,
          MaxNumberOfMessages: 10,
          WaitTimeSeconds: 20,
          MessageAttributeNames: ['All']
        };

        const result = await this.sqs.receiveMessage(params).promise();
        
        if (result.Messages && result.Messages.length > 0) {
          for (const message of result.Messages) {
            await this.handleResponse(message);
            
            // Delete message after processing
            await this.sqs.deleteMessage({
              QueueUrl: this.queueUrls.responses,
              ReceiptHandle: message.ReceiptHandle!
            }).promise();
          }
        }
      } catch (error) {
        console.error('Error polling responses:', error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  // Handle incoming responses and resolve pending promises
  private async handleResponse(message: any) {
    try {
      const response = JSON.parse(message.Body);
      const correlationId = response.correlationId;
      
      console.log('Received response for correlation ID:', correlationId);

      const pendingRequest = this.pendingRequests.get(correlationId);
      
      if (pendingRequest) {
        clearTimeout(pendingRequest.timeout);
        this.pendingRequests.delete(correlationId);
        
        if (response.success) {
          pendingRequest.resolve(response);
        } else {
          pendingRequest.reject(new Error(response.errorMessage || 'Operation failed'));
        }
      } else {
        console.warn('No pending request found for correlation ID:', correlationId);
      }
    } catch (error) {
      console.error('Error handling response:', error);
    }
  }
}