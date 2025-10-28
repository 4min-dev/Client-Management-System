import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { User } from '../lib/types'

type InitialUserSlice = {
    user: User
}

const initialState: InitialUserSlice = {
    user: {
        id: '',
        login: ''
    }
}

const userSlice = createSlice({
    name: 'userSlice',
    initialState,
    reducers: {
        newUser(state, action: PayloadAction<InitialUserSlice>) {
            state.user = action.payload.user
        }
    }
})

export const { newUser } = userSlice.actions

export default userSlice