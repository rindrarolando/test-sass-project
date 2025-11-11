/**
 * Validation métier pour les textes
 * ✅ Pattern obligatoire : Validation métier séparée du service
 */

import { TextType, CreateTextType } from '../../../../shared/types.js';

export interface TextValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Valide les données d'un nouveau texte
 */
export function validateTextData(data: { title?: string | null; content: string }): TextValidationResult {
  const result: TextValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  };

  // Validation contenu obligatoire
  if (!data.content || data.content.trim().length === 0) {
    result.errors.push('Le contenu est requis');
    result.valid = false;
  }

  // Validation longueur contenu
  if (data.content && data.content.length > 1000) {
    result.errors.push('Le contenu ne peut pas dépasser 1000 caractères');
    result.valid = false;
  }

  // Validation titre optionnel
  if (data.title && data.title.length > 200) {
    result.errors.push('Le titre ne peut pas dépasser 200 caractères');
    result.valid = false;
  }

  // Avertissement pour contenu court
  if (data.content && data.content.trim().length < 10) {
    result.warnings.push('Le contenu est très court');
  }

  return result;
}

/**
 * Valide les données de mise à jour d'un texte
 */
export function validateTextUpdate(
  existingText: TextType | null,
  updateData: { title?: string; content?: string }
): TextValidationResult {
  const result: TextValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  };

  // Vérifier que le texte existe
  if (!existingText) {
    result.errors.push('Texte non trouvé');
    result.valid = false;
    return result;
  }

  // Validation longueur contenu si fourni
  if (updateData.content !== undefined) {
    if (updateData.content.length > 1000) {
      result.errors.push('Le contenu ne peut pas dépasser 1000 caractères');
      result.valid = false;
    }
    if (updateData.content.trim().length < 10) {
      result.warnings.push('Le contenu est très court');
    }
  }

  // Validation longueur titre si fourni
  if (updateData.title !== undefined && updateData.title.length > 200) {
    result.errors.push('Le titre ne peut pas dépasser 200 caractères');
    result.valid = false;
  }

  return result;
}

