import axios from 'axios';
import { showAlert } from './alert';

// type is either "password" or "data"
export const updateSettings = async (data, type) => {
  try {
    // const url =
    //   type === 'password'
    //     ? 'http://localhost:3000/api/v1/users/updatePassword'
    //     : 'http://localhost:3000/api/v1/users/updateMe';
    const url =
      type === 'password'
        ? '/api/v1/users/updatePassword'
        : '/api/v1/users/updateMe';

    const res = await axios({
      method: 'PATCH',
      url,
      data
    });

    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()}Data updated successfully!`);
    }
  } catch (error) {
    console.log(error);
    //showAlert('error', error.response.data.message);
  }
};
