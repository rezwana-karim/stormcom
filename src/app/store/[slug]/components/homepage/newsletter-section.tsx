"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NewsletterConfig } from "@/types/storefront-config";

interface NewsletterSectionProps {
  storeSlug: string;
  config: NewsletterConfig;
}

type FormState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Newsletter Subscription Section
 * Client component with form validation and async submission
 * Shows success/error states with proper feedback
 */
export function NewsletterSection({ storeSlug, config }: NewsletterSectionProps) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>('idle');
  const [errorMessage, setErrorMessage] = useState("");

  if (!config.enabled) {
    return null;
  }

  // Email validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset error
    setErrorMessage("");

    // Validate email
    if (!email.trim()) {
      setErrorMessage("Please enter your email address");
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMessage("Please enter a valid email address");
      return;
    }

    // Set loading state
    setState('loading');

    try {
      // Call server action
      const response = await fetch(`/store/${storeSlug}/actions/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }

      // Success
      setState('success');
      setEmail("");
      
      // Reset after 5 seconds
      setTimeout(() => {
        setState('idle');
      }, 5000);
    } catch (error) {
      setState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong');
      
      // Reset error state after 5 seconds
      setTimeout(() => {
        setState('idle');
        setErrorMessage("");
      }, 5000);
    }
  };

  return (
    <section className="border-y bg-muted/50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Mail className="h-8 w-8 text-primary" />
          </div>

          {/* Headline */}
          <h2 className="text-3xl font-bold mb-4">{config.headline}</h2>
          
          {/* Description */}
          <p className="text-lg text-muted-foreground mb-8">
            {config.description}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-4">
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={state === 'loading' || state === 'success'}
              className={cn(
                "flex-1 h-12 text-base",
                state === 'error' && "border-destructive focus-visible:ring-destructive"
              )}
              aria-label="Email address"
            />
            <Button 
              type="submit" 
              size="lg"
              disabled={state === 'loading' || state === 'success'}
              className="h-12 px-8"
            >
              {state === 'loading' ? 'Subscribing...' : state === 'success' ? 'Subscribed!' : 'Subscribe'}
            </Button>
          </form>

          {/* Feedback Messages */}
          {state === 'success' && (
            <p className="text-sm text-green-600 dark:text-green-400 mb-2">
              ✓ Thank you for subscribing! Check your email for confirmation.
            </p>
          )}
          
          {state === 'error' && errorMessage && (
            <p className="text-sm text-destructive mb-2">
              ✗ {errorMessage}
            </p>
          )}

          {/* Privacy Text */}
          {config.privacyText && (
            <p className="text-xs text-muted-foreground">
              {config.privacyText}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
