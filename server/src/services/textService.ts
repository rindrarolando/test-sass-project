import { onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { validateAuth, verifyWorkspaceToken, isValidWorkspaceToken } from '../utils/authWorkspace.js';
import { validateRequiredFields, isSuccess, handleError } from '../utils/validation.js';
import { createResponseWithTokens } from '../../shared/responses.js';
import { getTextRepository } from '../../db/repositories/index.js';
import { WORKSPACE_ROLES } from '../../../shared/types.js';
import { ERRORS, withDetails } from '../../shared/types/errors.js';
import { validateTextData, validateTextUpdate } from '../utils/validation/textValidation.js';

/**
 * Service de gestion des textes
 * 🔧 VERSION DEMO - Service de test pour enregistrer et récupérer des textes
 */

/**
 * Créer un nouveau texte
 */
export const createText = onCall({
  memory: '512MiB',
  timeoutSeconds: 60
}, async (request) => {
  try {
    // ✅ 1. Validation auth OBLIGATOIRE
    const authResponse = validateAuth(request.auth);
    if (!isSuccess(authResponse)) return authResponse;
    const uid = authResponse.user;

    // ✅ 2. Extraction et validation params
    const { workspaceToken, content, title } = request.data;
    const validationResponse = validateRequiredFields(request.data, [
      'workspaceToken', 'content'
    ]);
    if (!isSuccess(validationResponse)) return validationResponse;

    // ✅ 3. Validation workspace + rôles
    const tokenValidation = await verifyWorkspaceToken(
      workspaceToken, 
      uid, 
      WORKSPACE_ROLES.EDITOR // Rôle requis pour créer des textes
    );
    const validationResult = isValidWorkspaceToken(tokenValidation);
    if (!isSuccess(validationResult)) return validationResult;
    const { workspace_id, workspace_tokens } = validationResult;
    const response = createResponseWithTokens(workspace_tokens);

    // ✅ 4. Validation métier spécifique (séparée)
    const textValidation = validateTextData({ title, content });
    if (!textValidation.valid) {
      return response.error(withDetails(ERRORS.INVALID_INPUT, {
        message: textValidation.errors.join(', '),
        errors: textValidation.errors
      }));
    }

    // ✅ 5. Logique métier via repository
    const textData = {
      title: title?.trim() || 'Sans titre',
      content: content.trim(),
      created_by: uid
    };
    
    const newText = await getTextRepository().create(workspace_id, textData);

    // ✅ 6. Logging succès
    logger.info(`Texte créé avec succès pour workspace ${workspace_id} par ${uid}`);

    // ✅ 7. Réponse standardisée
    return response.success({ text: newText });
    
  } catch (error) {
    logger.error(`Erreur dans createText:`, error);
    return handleError(error);
  }
});

/**
 * Récupérer tous les textes d'un workspace
 */
export const getTexts = onCall({
  memory: '512MiB',
  timeoutSeconds: 60
}, async (request) => {
  try {
    // ✅ 1. Validation auth OBLIGATOIRE
    const authResponse = validateAuth(request.auth);
    if (!isSuccess(authResponse)) return authResponse;
    const uid = authResponse.user;

    // ✅ 2. Extraction et validation params
    const { workspaceToken } = request.data;
    const validationResponse = validateRequiredFields(request.data, [
      'workspaceToken'
    ]);
    if (!isSuccess(validationResponse)) return validationResponse;

    // ✅ 3. Validation workspace + rôles
    const tokenValidation = await verifyWorkspaceToken(
      workspaceToken, 
      uid, 
      WORKSPACE_ROLES.EDITOR // Rôle requis pour lire les textes
    );
    const validationResult = isValidWorkspaceToken(tokenValidation);
    if (!isSuccess(validationResult)) return validationResult;
    const { workspace_id, workspace_tokens } = validationResult;
    const response = createResponseWithTokens(workspace_tokens);

    // ✅ 5. Logique métier via repository
    const texts = await getTextRepository().getByWorkspace(workspace_id);

    // ✅ 6. Logging succès
    logger.info(`Textes récupérés pour workspace ${workspace_id} par ${uid}`);

    // ✅ 7. Réponse standardisée
    return response.success({ texts });
    
  } catch (error) {
    logger.error(`Erreur dans getTexts:`, error);
    return handleError(error);
  }
});

/**
 * Supprimer un texte
 */
export const deleteText = onCall({
  memory: '512MiB',
  timeoutSeconds: 60
}, async (request) => {
  try {
    // ✅ 1. Validation auth OBLIGATOIRE
    const authResponse = validateAuth(request.auth);
    if (!isSuccess(authResponse)) return authResponse;
    const uid = authResponse.user;

    // ✅ 2. Extraction et validation params
    const { workspaceToken, textId } = request.data;
    const validationResponse = validateRequiredFields(request.data, [
      'workspaceToken', 'textId'
    ]);
    if (!isSuccess(validationResponse)) return validationResponse;

    // ✅ 3. Validation workspace + rôles
    const tokenValidation = await verifyWorkspaceToken(
      workspaceToken, 
      uid, 
      WORKSPACE_ROLES.ADMIN // Rôle requis pour supprimer des textes
    );
    const validationResult = isValidWorkspaceToken(tokenValidation);
    if (!isSuccess(validationResult)) return validationResult;
    const { workspace_id, workspace_tokens } = validationResult;
    const response = createResponseWithTokens(workspace_tokens);

    // ✅ 5. Logique métier via repository
    const deleted = await getTextRepository().delete(textId, workspace_id);
    
    if (!deleted) {
      return response.error(withDetails(ERRORS.NOT_FOUND, {
        message: 'Texte non trouvé'
      }));
    }

    // ✅ 6. Logging succès
    logger.info(`Texte ${textId} supprimé pour workspace ${workspace_id} par ${uid}`);

    // ✅ 7. Réponse standardisée
    return response.success({ deleted: true });
    
  } catch (error) {
    logger.error(`Erreur dans deleteText:`, error);
    return handleError(error);
  }
});

/**
 * Mettre à jour un texte
 */
export const updateText = onCall({
  memory: '512MiB',
  timeoutSeconds: 60
}, async (request) => {
  try {
    // ✅ 1. Validation auth OBLIGATOIRE
    const authResponse = validateAuth(request.auth);
    if (!isSuccess(authResponse)) return authResponse;
    const uid = authResponse.user;

    // ✅ 2. Extraction et validation params
    const { workspaceToken, textId, title, content } = request.data;
    const validationResponse = validateRequiredFields(request.data, [
      'workspaceToken', 'textId'
    ]);
    if (!isSuccess(validationResponse)) return validationResponse;

    // ✅ 3. Validation workspace + rôles
    const tokenValidation = await verifyWorkspaceToken(
      workspaceToken, 
      uid, 
      WORKSPACE_ROLES.EDITOR // Rôle requis pour mettre à jour des textes
    );
    const validationResult = isValidWorkspaceToken(tokenValidation);
    if (!isSuccess(validationResult)) return validationResult;
    const { workspace_id, workspace_tokens } = validationResult;
    const response = createResponseWithTokens(workspace_tokens);

    // ✅ 4. Validation métier spécifique (séparée)
    // Récupérer le texte existant pour validation
    const existingText = await getTextRepository().getById(textId, workspace_id);
    const textValidation = validateTextUpdate(existingText, { title, content });
    if (!textValidation.valid) {
      return response.error(withDetails(ERRORS.INVALID_INPUT, {
        message: textValidation.errors.join(', '),
        errors: textValidation.errors
      }));
    }

    // ✅ 5. Logique métier via repository
    const updateData: { title?: string; content?: string } = {};
    if (title !== undefined) {
      updateData.title = title.trim();
    }
    if (content !== undefined) {
      updateData.content = content.trim();
    }

    const updatedText = await getTextRepository().update(textId, workspace_id, updateData);
    
    if (!updatedText) {
      return response.error(withDetails(ERRORS.NOT_FOUND, {
        message: 'Texte non trouvé'
      }));
    }

    // ✅ 6. Logging succès
    logger.info(`Texte ${textId} mis à jour pour workspace ${workspace_id} par ${uid}`);

    // ✅ 7. Réponse standardisée
    return response.success({ text: updatedText });
    
  } catch (error) {
    logger.error(`Erreur dans updateText:`, error);
    return handleError(error);
  }
});
