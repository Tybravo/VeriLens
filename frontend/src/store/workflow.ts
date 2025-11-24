import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface AttestationState {
  contentHashHex: string
  manifestHashHex: string
  codeHashHex: string
  signatureHex: string
  proverTeeId: string
}

export interface SealState {
  sealId: string
  accessPolicy: string
  threshold: number
  decryptTest?: 'pending' | 'ok' | 'failed'
}

export interface WorkflowState {
  walrusMediaId: string | null
  walrusManifestId: string | null
  verificationDigest: string | null
  attestation: AttestationState | null
  sealInfo: SealState | null
  badgeWalrusId: string | null
  certificateWalrusId: string | null
}

const initialState: WorkflowState = {
  walrusMediaId: null,
  walrusManifestId: null,
  verificationDigest: null,
  attestation: null,
  sealInfo: null,
  badgeWalrusId: null,
  certificateWalrusId: null,
}

const slice = createSlice({
  name: 'workflow',
  initialState,
  reducers: {
    setWalrusIds(state, action: PayloadAction<{ media: string; manifest: string }>) {
      state.walrusMediaId = action.payload.media
      state.walrusManifestId = action.payload.manifest
    },
    setVerificationDigest(state, action: PayloadAction<string>) {
      state.verificationDigest = action.payload
    },
    setAttestation(state, action: PayloadAction<AttestationState>) {
      state.attestation = action.payload
    },
    setSealInfo(state, action: PayloadAction<SealState | null>) {
      state.sealInfo = action.payload
    },
    setBadgeWalrusId(state, action: PayloadAction<string>) {
      state.badgeWalrusId = action.payload
    },
    setCertificateWalrusId(state, action: PayloadAction<string>) {
      state.certificateWalrusId = action.payload
    },
    resetWorkflow() {
      return initialState
    }
  }
})

export const {
  setWalrusIds,
  setVerificationDigest,
  setAttestation,
  setSealInfo,
  setBadgeWalrusId,
  setCertificateWalrusId,
  resetWorkflow,
} = slice.actions

export const store = configureStore({
  reducer: { workflow: slice.reducer }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
