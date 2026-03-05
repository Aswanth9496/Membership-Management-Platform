import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export const showAlert = (title: string, text?: string, icon: 'success' | 'error' | 'warning' | 'info' | 'question' = 'info') => {
    return MySwal.fire({
        title,
        text,
        icon,
        position: 'center',
        showConfirmButton: true,
        confirmButtonColor: '#2563eb',
    });
};

export const showConfirmDialog = (title: string, text: string, confirmButtonText: string = 'Yes', cancelButtonText: string = 'No') => {
    return MySwal.fire({
        title,
        text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#d33',
        confirmButtonText,
        cancelButtonText,
    });
};

export default MySwal;
