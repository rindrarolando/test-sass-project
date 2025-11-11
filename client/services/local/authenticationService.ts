import { httpsCallable } from 'firebase/functions';
import { functions } from '@/services/api/firebase/config';
import { auth } from '@/services/api/firebase/config';

// ========================== SERVICE URLS ==========================

export const SERVICE_URL = {
  FIREBASE: 'http://localhost:5001/demo-project/us-central1',
  FASTAPI: 'http://127.0.0.1:8080',
  APP: 'http://localhost:3000'
};

// ========================== TYPES ==========================

export interface WorkspaceToken {
  role: string;
  token: string;
}

export type WorkspaceTokenMap = Record<string, WorkspaceToken>;

// ========================== STORAGE KEYS ==========================

const WORKSPACE_TOKENS_KEY = 'agentova_workspace_tokens';

// ========================== FIREWALL ==========================

interface FirewallEntry {
  count: number;
  resetTime: number;
}

const requestFirewall = new Map<string, FirewallEntry>();
const MAX_REQUESTS_PER_ENDPOINT = 10;
const FIREWALL_RESET_TIME = 10000; // 10 secondes

function checkFirewall(functionName: string): boolean {
  const now = Date.now();
  const entry = requestFirewall.get(functionName);

  if (!entry || now > entry.resetTime) {
    requestFirewall.set(functionName, {
      count: 1,
      resetTime: now + FIREWALL_RESET_TIME
    });
    return true;
  }

  if (entry.count >= MAX_REQUESTS_PER_ENDPOINT) {
    return false;
  }

  entry.count++;
  return true;
}

// ========================== TOKEN MANAGEMENT ==========================

/**
 * Récupère le token d'authentification Firebase
 */
export async function getIdToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return await user.getIdToken();
}

/**
 * Stocke les tokens workspace dans localStorage
 */
export function storeTokens(tokens: WorkspaceTokenMap): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(WORKSPACE_TOKENS_KEY, JSON.stringify(tokens));
    } catch (error) {
      console.error('Error storing tokens:', error);
    }
  }
}

/**
 * Récupère les tokens workspace stockés
 */
export function getStoredTokens(): WorkspaceTokenMap {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(WORKSPACE_TOKENS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error retrieving tokens:', error);
    }
  }
  return {};
}

/**
 * Appelle une fonction Firebase sécurisée
 */
export async function callSecuredFunction<T>(
  functionName: string,
  workspaceId: string,
  data?: any
): Promise<T> {
  // 1️⃣ Firewall check
  if (!checkFirewall(functionName)) {
    throw new Error(`🚨 PAREFEU: Trop de requêtes pour ${functionName}`);
  }

  // 2️⃣ Token workspace
  const storedTokens = getStoredTokens();
  const workspaceToken = storedTokens[workspaceId]?.token || null;

  // 3️⃣ Appel Firebase avec token
  const callable = httpsCallable(functions, functionName);
  const result = await callable({
    ...data,
    workspaceToken
  });

  const responseData = result.data as { success: boolean; error?: any; workspace_tokens?: WorkspaceTokenMap } & T;

  // 4️⃣ Vérifier si c'est une erreur
  if (!responseData.success) {
    const errorMessage = responseData.error?.message || responseData.error?.code || 'Erreur lors de l\'appel à la fonction';
    throw new Error(errorMessage);
  }

  // 5️⃣ Mise à jour tokens si reçus
  if (responseData.workspace_tokens) {
    storeTokens(responseData.workspace_tokens);
  }

  // 6️⃣ Extraire les données (enlever success et workspace_tokens)
  const { success, workspace_tokens: _, ...dataOnly } = responseData;
  return dataOnly as T;
}

/**
 * Appelle une fonction Firebase avec SSE
 */
export async function callSecuredSSEFunction(
  functionName: string,
  workspaceId: string,
  data?: any
): Promise<Response> {
  const workspace_tokens = getStoredTokens();
  const workspaceToken = workspace_tokens[workspaceId]?.token || null;
  const idToken = await getIdToken();

  return await fetch(`${SERVICE_URL.FASTAPI}/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({
      workspace_id: workspaceId,
      workspaceToken,
      ...data
    })
  });
}

/**
 * Déconnecte l'utilisateur
 * 🔧 VERSION DEMO - FONCTION VIDE
 */
export async function logoutUser(): Promise<void> {
  // 🔧 FONCTION VIDE - Ne fait rien
}

/**
 * Nettoie tout le cache de l'application
 * 🔧 VERSION DEMO - FONCTION VIDE
 */
export function clearAllCache(): void {
  // 🔧 FONCTION VIDE - Ne fait rien
}