import { configureStore } from '@reduxjs/toolkit'
import logsReducer from './logsReducer'
import spiReducer from './spiReducer'
import logger from 'redux-logger'
import thunk from 'redux-thunk'

const store = configureStore({
  reducer: {
    logsReducer,
    spiReducer,
  },
  middleware: [thunk, logger],
})

export default store

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch