"use client";

import { FormEvent, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { clsx } from "clsx";
import { contentDashboardPanel, homePrimaryPillBtn } from "@/lib/tool-ui";
import {
  isContactValidationError,
  submitContactForm,
  validateContactPayload,
  type ContactSubmitErrorCode,
} from "@/lib/submit-contact-form";

type FormStatus = "idle" | "sending" | "success" | "error";

export function ContactForm() {
  const t = useTranslations("Contact");
  const baseId = useId();
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorCode, setErrorCode] = useState<ContactSubmitErrorCode | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    setErrorCode(null);

    const form = event.currentTarget;
    const data = new FormData(form);

    if (trimField(data.get("website"))) {
      setStatus("success");
      form.reset();
      return;
    }

    const validated = validateContactPayload({
      name: data.get("name"),
      email: data.get("email"),
      subject: data.get("subject"),
      message: data.get("message"),
    });

    if (!validated.ok) {
      setErrorCode(validated.error);
      setStatus("error");
      return;
    }

    try {
      await submitContactForm(validated.data);
      setStatus("success");
      form.reset();
    } catch (error) {
      const code = error instanceof Error ? error.message : "send_failed";
      if (code === "activation_required") {
        setErrorCode("activation_required");
      } else if (isContactValidationError(code)) {
        setErrorCode(code);
      } else {
        setErrorCode("send_failed");
      }
      setStatus("error");
    }
  };

  const errorMessage =
    errorCode === "activation_required"
      ? t("errorActivation")
      : errorCode === "name_required"
          ? t("nameRequired")
          : errorCode === "email_invalid"
            ? t("emailRequired")
            : errorCode === "subject_required"
              ? t("subjectRequired")
              : errorCode === "message_required"
                ? t("messageRequired")
                : t("error");

  return (
    <section className={clsx(contentDashboardPanel, "privacy-section max-w-2xl mx-auto w-full")}>
      {status === "success" ? (
        <p className="privacy-section__prose text-center" role="status">
          {t("success")}
        </p>
      ) : (
        <form className="protect-form" onSubmit={onSubmit} noValidate>
          <div className="protect-form__fields">
            <label className="protect-form__label" htmlFor={`${baseId}-name`}>
              {t("nameLabel")}
            </label>
            <input
              id={`${baseId}-name`}
              name="name"
              type="text"
              required
              autoComplete="name"
              className="protect-form__input"
              disabled={status === "sending"}
            />

            <label className="protect-form__label" htmlFor={`${baseId}-email`}>
              {t("emailLabel")}
            </label>
            <input
              id={`${baseId}-email`}
              name="email"
              type="email"
              required
              autoComplete="email"
              className="protect-form__input"
              disabled={status === "sending"}
            />

            <label className="protect-form__label" htmlFor={`${baseId}-subject`}>
              {t("subjectLabel")}
            </label>
            <input
              id={`${baseId}-subject`}
              name="subject"
              type="text"
              required
              className="protect-form__input"
              disabled={status === "sending"}
            />

            <label className="protect-form__label" htmlFor={`${baseId}-message`}>
              {t("messageLabel")}
            </label>
            <textarea
              id={`${baseId}-message`}
              name="message"
              required
              rows={6}
              className="protect-form__input min-h-[9rem] resize-y"
              disabled={status === "sending"}
            />
          </div>

          <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden>
            <label htmlFor={`${baseId}-website`}>Website</label>
            <input id={`${baseId}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          {status === "error" ? (
            <p className="protect-form__error" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <div className="pt-2">
            <button
              type="submit"
              className={clsx(homePrimaryPillBtn, "w-full sm:w-auto")}
              disabled={status === "sending"}
            >
              {status === "sending" ? t("sending") : t("submit")}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function trimField(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}
