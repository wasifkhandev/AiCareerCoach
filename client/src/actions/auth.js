import axios from 'axios';

// Action Types
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
export const LOGIN_FAIL = 'LOGIN_FAIL';
export const REGISTER_SUCCESS = 'REGISTER_SUCCESS';
export const REGISTER_FAIL = 'REGISTER_FAIL';
export const LOGOUT = 'LOGOUT';
export const USER_LOADED = 'USER_LOADED';
export const AUTH_ERROR = 'AUTH_ERROR';

// Load User
export const loadUser = () => async dispatch => {
    try {
        const res = await axios.get('/api/auth/me');
        dispatch({
            type: USER_LOADED,
            payload: res.data
        });
    } catch (err) {
        dispatch({
            type: AUTH_ERROR
        });
    }
};

// Register User
export const register = ({ name, email, password }) => async dispatch => {
    const config = {
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const body = JSON.stringify({ name, email, password });

    try {
        const res = await axios.post('/api/auth/register', body, config);
        dispatch({
            type: REGISTER_SUCCESS,
            payload: res.data
        });
        dispatch(loadUser());
    } catch (err) {
        const errors = err.response.data.errors;
        if (errors) {
            errors.forEach(error => console.error(error.msg));
        }
        dispatch({
            type: REGISTER_FAIL
        });
    }
};

// Login User
export const login = (email, password) => async dispatch => {
    const config = {
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const body = JSON.stringify({ email, password });

    try {
        const res = await axios.post('/api/auth/login', body, config);
        dispatch({
            type: LOGIN_SUCCESS,
            payload: res.data
        });
        dispatch(loadUser());
    } catch (err) {
        const errors = err.response.data.errors;
        if (errors) {
            errors.forEach(error => console.error(error.msg));
        }
        dispatch({
            type: LOGIN_FAIL
        });
    }
};

// Logout
export const logout = () => dispatch => {
    dispatch({ type: LOGOUT });
}; 