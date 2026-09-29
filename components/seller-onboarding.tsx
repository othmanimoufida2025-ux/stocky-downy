"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Building2,
  Check,
  ImagePlus,
  KeyRound,
  MailCheck,
  PackagePlus,
  UserRound,
} from "lucide-react";
import { Button } from "./ui/button";

type Action = (body: Record<string, unknown>) => Promise<unknown>;
const steps = [
  ["Compte", UserRound],
  ["Boutique", Building2],
  ["Identité", ImagePlus],
  ["Produit", PackagePlus],
] as const;

export function SellerOnboarding({
  act,
  busy,
  onComplete,
  accountReady = false,
}: {
  act: Action;
  busy: boolean;
  onComplete: () => void;
  accountReady?: boolean;
}) {
  const [register, setRegister] = useState(accountReady),
    [step, setStep] = useState(accountReady ? 1 : 0),
    [store, setStore] = useState<Record<string, string>>(() => {
      if (typeof window === "undefined") return {};
      try { return JSON.parse(sessionStorage.getItem("stocky-onboarding") || "{}"); } catch { return {}; }
    }),
    [logo, setLogo] = useState(""),
    [cover, setCover] = useState(""),
    [productImage, setProductImage] = useState(""),
    [otpSent, setOtpSent] = useState(false),
    [credentials, setCredentials] = useState({ email: "", password: "" }),
    [uploading, setUploading] = useState(false),
    [localError, setLocalError] = useState("");
  useEffect(() => { sessionStorage.setItem("stocky-onboarding", JSON.stringify(store)); }, [store]);
  async function upload(file: File | undefined, setter: (url: string) => void) {
    if (!file) return;
    setUploading(true);
    setLocalError("");
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/media", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      setter(result.url);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Échec de l’envoi");
    } finally {
      setUploading(false);
    }
  }
  async function account(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    if (register) {
      const next = {
        email: String(values.email || ""),
        password: String(values.password || ""),
      };
      const result = await act({ action: "otp", email: next.email });
      if (result) {
        setCredentials(next);
        setOtpSent(true);
      }
      return;
    }
    const result = await act({ action: "login", ...values });
    if (result) {
      onComplete();
    }
  }
  async function verifyAccount(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    const result = await act({
      action: "verifyRegister",
      ...credentials,
      code: String(values.code || ""),
    });
    if (result) setStep(1);
  }
  async function branding() {
    const result = await act({ action: "store", ...store, logo, cover });
    if (result) setStep(3);
  }
  async function product(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    const result = await act({
      action: "product",
      ...values,
      price: Number(values.price),
      stock: Number(values.stock),
      image: productImage,
    });
    if (result) onComplete();
  }
  return (
    <div className="onboarding">
      {!accountReady && <div className="onboarding-switch">
        <button
          className={!register ? "active" : ""}
          onClick={() => {
            setRegister(false);
            setStep(0);
            setOtpSent(false);
          }}
        >
          Connexion
        </button>
        <button
          className={register ? "active" : ""}
          onClick={() => {
            setRegister(true);
            setStep(0);
            setOtpSent(false);
          }}
        >
          Créer ma boutique
        </button>
      </div>}
      {register && (
        <div className="stepper">
          {steps.map(([name, Icon], index) => (
            <div
              className={index === step ? "active" : index < step ? "done" : ""}
              key={name}
            >
              <span>{index < step ? <Check /> : <Icon />}</span>
              <small>{name}</small>
            </div>
          ))}
        </div>
      )}
      {localError && <p className="p-error">{localError}</p>}
      {step === 0 && !otpSent && (
        <form onSubmit={account}>
          <label>
            E-mail professionnel
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Mot de passe
            <input
              name="password"
              type="password"
              minLength={10}
              maxLength={128}
              autoComplete={register ? "new-password" : "current-password"}
              required
            />
          </label>
          {register && (
            <>
              <p className="form-hint">
                Nous enverrons un code à 6 chiffres sur cette adresse avant de
                créer votre espace professionnel.
              </p>
              <label className="check-label">
                <input type="checkbox" required />
                Je crée un compte professionnel Stocky.
              </label>
            </>
          )}
          <Button disabled={busy}>
            {busy
                ? "Veuillez patienter…"
                : register
                ? "Recevoir mon code de vérification"
                : "Se connecter"}
          </Button>
        </form>
      )}
      {step === 0 && register && otpSent && (
        <form className="otp-form" onSubmit={verifyAccount}>
          <div className="otp-icon"><MailCheck /></div>
          <div className="otp-copy">
            <span>E-MAIL ENVOYÉ</span>
            <h3>Vérifiez votre boîte de réception</h3>
            <p>
              Entrez le code envoyé à <strong>{credentials.email}</strong>. Le
              code expire dans 10 minutes.
            </p>
          </div>
          <label>
            Code de vérification
            <div className="otp-input-wrap">
              <KeyRound />
              <input
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="000000"
                required
                autoFocus
              />
            </div>
          </label>
          <Button disabled={busy}>
            {busy ? "Vérification…" : "Vérifier et continuer"}
          </Button>
          <button
            type="button"
            className="otp-back"
            onClick={() => setOtpSent(false)}
          >
            Modifier l’adresse e-mail
          </button>
        </form>
      )}
      {step === 1 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setStore(
              Object.fromEntries(new FormData(e.currentTarget)) as Record<
                string,
                string
              >,
            );
            setStep(2);
          }}
        >
          <div className="field-row">
            <label>
              Nom de la boutique
              <input name="name" required maxLength={100} defaultValue={store.name} />
            </label>
            <label>
              Téléphone
              <input name="phone" type="tel" required maxLength={30} defaultValue={store.phone} />
            </label>
          </div>
          <label>
            Présentation
            <textarea
              name="description"
              required
              maxLength={2000}
              placeholder="Votre univers, vos collections et votre engagement…"
              defaultValue={store.description}
            />
          </label>
          <div className="field-row">
            <label>
              Gouvernorat
              <select name="governorate" required defaultValue="">
                <option value="" disabled>
                  Sélectionner
                </option>
                {[
                  "Tunis",
                  "Ariana",
                  "Ben Arous",
                  "Manouba",
                  "Nabeul",
                  "Sousse",
                  "Monastir",
                  "Sfax",
                  "Autre",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              WhatsApp
              <input name="whatsapp" type="tel" maxLength={30} />
            </label>
          </div>
          <label>
            Adresse
            <input name="address" required maxLength={500} />
          </label>
          <Button>Continuer vers l’identité visuelle</Button>
        </form>
      )}
      {step === 2 && (
        <div className="branding-step">
          <div className="upload-card">
            <div className="logo-preview">
              {logo ? <img src={logo} alt="Logo boutique" /> : <ImagePlus />}
            </div>
            <h3>Logo de la boutique</h3>
            <p>Format carré recommandé.</p>
            <label className="button button-outline">
              Choisir le logo
              <input
                hidden
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => upload(e.target.files?.[0], setLogo)}
              />
            </label>
          </div>
          <div className="upload-card">
            <div className="cover-preview">
              {cover ? (
                <img src={cover} alt="Couverture boutique" />
              ) : (
                <ImagePlus />
              )}
            </div>
            <h3>Image de couverture</h3>
            <p>Format horizontal recommandé.</p>
            <label className="button button-outline">
              Choisir la couverture
              <input
                hidden
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => upload(e.target.files?.[0], setCover)}
              />
            </label>
          </div>
          <Button
            disabled={busy || uploading || !logo}
            onClick={branding}
          >
            {uploading ? "Envoi des images…" : "Créer ma boutique"}
          </Button>
        </div>
      )}
      {step === 3 && (
        <form onSubmit={product}>
          <div className="onboarding-success">
            <Check />
            <div>
              <strong>Votre boutique est créée.</strong>
              <p>
                Ajoutez un premier produit. La publication aura lieu après
                validation par Stocky.
              </p>
            </div>
          </div>
          <label>
            Nom du produit
            <input name="name" required maxLength={150} />
          </label>
          <div className="field-row">
            <label>
              Prix (DT)
              <input
                name="price"
                type="number"
                min="0.001"
                step="0.001"
                required
              />
            </label>
            <label>
              Stock
              <input name="stock" type="number" min="0" step="1" required />
            </label>
          </div>
          <label>
            Catégorie
            <select name="category">
              <option>Femme</option>
              <option>Homme</option>
              <option>Accessoires</option>
              <option>Maison</option>
            </select>
          </label>
          <label>
            Description
            <textarea name="description" required maxLength={5000} />
          </label>
          <label className="upload-inline">
            Photo du produit
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => upload(e.target.files?.[0], setProductImage)}
            />
            {productImage && <img src={productImage} alt="Produit" />}
          </label>
          <div className="dialog-actions">
            <Button type="button" variant="outline" onClick={onComplete}>
              Terminer plus tard
            </Button>
            <Button disabled={busy || uploading}>Ajouter et terminer</Button>
          </div>
        </form>
      )}
    </div>
  );
}
