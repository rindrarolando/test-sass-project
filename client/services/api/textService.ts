import { callSecuredFunction } from '@/services/local/authenticationService';
import { TextType as SharedTextType } from '../../../shared/types';

/**
 * Service de gestion des textes côté client
 */

// ✅ Client version with serialized dates (from API)
export interface TextType extends Omit<SharedTextType, 'created_at' | 'updated_at'> {
  created_at: string; // Serialized date from API
  updated_at: string; // Serialized date from API
}

// ✅ Client request type (without created_by, set server-side)
export interface CreateTextRequest {
  title?: string;
  content: string;
}

export interface TextsResponse {
  texts: TextType[];
}

export interface TextResponse {
  text: TextType;
}

export class TextService {
  /**
   * Créer un nouveau texte
   */
  static async createText(
    workspaceId: string,
    data: CreateTextRequest
  ): Promise<TextType> {
    try {
      const result = await callSecuredFunction<TextResponse>(
        'createText',
        workspaceId,
        {
          content: data.content,
          title: data.title
        }
      );
      return result.text;
    } catch (error) {
      console.error('Erreur création texte:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les textes d'un workspace
   */
  static async getTexts(workspaceId: string): Promise<TextType[]> {
    try {
      const result = await callSecuredFunction<TextsResponse>(
        'getTexts',
        workspaceId
      );
      return result.texts;
    } catch (error) {
      console.error('Erreur récupération textes:', error);
      throw error;
    }
  }

  /**
   * Supprimer un texte
   */
  static async deleteText(
    workspaceId: string,
    textId: string
  ): Promise<boolean> {
    try {
      await callSecuredFunction<{ deleted: boolean }>(
        'deleteText',
        workspaceId,
        { textId }
      );
      return true;
    } catch (error) {
      console.error('Erreur suppression texte:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un texte
   */
  static async updateText(
    workspaceId: string,
    textId: string,
    data: Partial<CreateTextRequest>
  ): Promise<TextType> {
    try {
      const result = await callSecuredFunction<TextResponse>(
        'updateText',
        workspaceId,
        {
          textId,
          ...data
        }
      );
      return result.text;
    } catch (error) {
      console.error('Erreur mise à jour texte:', error);
      throw error;
    }
  }
}
