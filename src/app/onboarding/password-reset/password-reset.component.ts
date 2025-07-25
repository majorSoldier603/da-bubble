import {CommonModule} from '@angular/common';
import {Component, ViewChild} from '@angular/core';
import {Router, RouterModule} from '@angular/router';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {FormValidationService} from '../../services/form-validation.service';
import {AuthService} from '../../services/auth.service';
import {NotificationsComponent} from '../notifications/notifications.component';


@Component({
	selector: 'app-password-reset',
	imports: [
		CommonModule,
		RouterModule,
		ReactiveFormsModule,
		NotificationsComponent
	],
	templateUrl: './password-reset.component.html',
	styleUrl: './password-reset.component.scss'
})

export class PasswordResetComponent {

	@ViewChild('notification') notificationComponent!: NotificationsComponent;

	/**
	 * Form group for managing the password reset form.
	 */
	resetPWForm: FormGroup;


	/**
	 * Constructor for the class that initializes the reset password form
	 * and injects the required services.
	 *
	 * @param {FormBuilder} fb - Instance of FormBuilder used to create and manage forms.
	 * @param {Router} router - Angular Router instance for navigation.
	 * @param {AuthService} authService - Service to handle authentication-related tasks.
	 * @return {void}
	 */
	constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {
		this.resetPWForm = this.fb.group({
			email: ['', [Validators.required, FormValidationService.emailValidator]],
		});
	}

	/**
	 * Handles form submission.
	 * If the form is valid, logs the email and navigates to the home page.
	 * calls the auth service to send the user an email reset.
	 * Otherwise, logs an error message.
	 */
	resetPassword() {
		if (this.resetPWForm.valid) {
			const email = this.resetPWForm.value.email;
			this.authService.resetPassword(email).then(r => console.info(r, 'reset password success'));
			this.notificationComponent.showNotification('Email sent successfully!');

			setTimeout(() => {
				this.resetPWForm.reset();
				this.router.navigate(['']).then(r => {
					console.info(r, 'navigated to login');
				});
			}, 3000);
		} else {
			console.info('Form is invalid');
		}
	}

	/**
	 * Navigates to the previous page in the browser history.
	 */
	navigateBack() {
		window.history.back();
	}
}
