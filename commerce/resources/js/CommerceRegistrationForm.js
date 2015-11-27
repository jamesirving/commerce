(function($){

if (typeof Craft.Commerce === typeof undefined) {
	Craft.Commerce = {};
}

/**
 * Registration Form class
 */
Craft.Commerce.RegistrationForm = Craft.BaseElementIndex.extend({
	licenseKey: null,
	licenseKeyStatus: null,

	$headers: null,
	$views: null,

	$validLicenseHeader: null,
	$invalidLicenseHeader: null,
	$mismatchedLicenseHeader: null,
	$unknownLicenseHeader: null,

	$validLicenseView: null,
	$updateLicenseView: null,

	$unregisterLicenseForm: null,
	$updateLicenseForm: null,
	$transferLicenseForm: null,

	$unregisterLicenseSpinner: null,
	$updateLicenseSpinner: null,
	$transferLicenseSpinner: null,

	$licenseKeyLabel: null,
	$licenseKeyInput: null,
	$updateBtn: null,
	$clearBtn: null,
	$licenseKeyError: null,

	init: function(licenseKey, licenseKeyStatus) {
		this.$headers = $('.reg-header');
		this.$views = $('.reg-view');

		this.$validLicenseHeader = $('#valid-license-header');
		this.$invalidLicenseHeader = $('#invalid-license-header');
		this.$mismatchedLicenseHeader = $('#mismatched-license-header');
		this.$unknownLicenseHeader = $('#unknown-license-header');

		this.$validLicenseView = $('#valid-license-view');
		this.$updateLicenseView = $('#update-license-view');

		this.$unregisterLicenseForm = $('#unregister-license-form');
		this.$updateLicenseForm = $('#update-license-form');
		this.$transferLicenseForm = $('#transfer-license-form');

		this.$unregisterLicenseSpinner = $('#unregister-license-spinner');
		this.$updateLicenseSpinner = $('#update-license-spinner');
		this.$transferLicenseSpinner = $('#transfer-license-spinner');

		this.$licenseKeyLabel = $('#license-key-label');
		this.$licenseKeyInput = $('#license-key-input');
		this.$updateBtn = $('#update-license-btn');
		this.$clearBtn = $('#clear-license-btn');
		this.$licenseKeyError = $('#license-key-error');

		this.addListener(this.$unregisterLicenseForm, 'submit', 'handleUnregisterLicenseFormSubmit');
		this.addListener(this.$updateLicenseForm, 'submit', 'handleUpdateLicenseFormSubmit');
		this.addListener(this.$transferLicenseForm, 'submit', 'handleTransferLicenseFormSubmit');

		this.addListener(this.$licenseKeyInput, 'focus', 'handleLicenseKeyFocus');
		this.addListener(this.$licenseKeyInput, 'textchange', 'handleLicenseKeyTextChange');
		this.addListener(this.$clearBtn, 'click', 'handleClearButtonClick');

		this.setLicenseKey(licenseKey);
		this.setLicenseKeyStatus(licenseKeyStatus);
	},

	setLicenseKey: function(licenseKey) {
		this.licenseKey = this.normalizeLicenseKey(licenseKey);
		var formattedLicenseKey = this.formatLicenseKey(this.licenseKey);
		this.$licenseKeyLabel.text(formattedLicenseKey);
		this.$licenseKeyInput.val(formattedLicenseKey);
		this.handleLicenseKeyTextChange();
	},

	setLicenseKeyStatus: function(licenseKeyStatus) {
		this.$headers.addClass('hidden');
		this.$views.addClass('hidden');

		this.licenseKeyStatus = licenseKeyStatus;

		// Show the proper header
		this['$'+licenseKeyStatus+'LicenseHeader'].removeClass('hidden');

		// Show the proper form view
		if (this.licenseKeyStatus == 'valid') {
			this.showValidLicenseView();
		} else {
			this.showLicenseFormView();
		}
	},

	showValidLicenseView: function() {
		this.$validLicenseView.removeClass('hidden');
	},

	showLicenseFormView: function() {
		this.$updateLicenseView.removeClass('hidden');
		this.$licenseKeyError.addClass('hidden');
	},

	normalizeLicenseKey: function(licenseKey) {
		if (licenseKey) {
			return licenseKey.toUpperCase().replace(/[^A-Z0-9]/g, '');
		}

		return '';
	},

	formatLicenseKey: function(licenseKey) {
		if (licenseKey) {
			return licenseKey.match(/.{1,4}/g).join('-');
		}

		return '';
	},

	validateLicenseKey: function(licenseKey) {
		return (licenseKey.length == 24);
	},

	handleUnregisterLicenseFormSubmit: function(ev) {
		ev.preventDefault();
		this.$unregisterLicenseSpinner.removeClass('hidden');
		Craft.postActionRequest('commerce/registration/unregister', $.proxy(function(response, textStatus) {
			this.$unregisterLicenseSpinner.addClass('hidden');
			if (textStatus == 'success') {
				this.setLicenseKey(response.licenseKey);
				this.setLicenseKeyStatus(response.licenseKeyStatus);
			}
		}, this));
	},

	handleUpdateLicenseFormSubmit: function(ev) {
		ev.preventDefault();
		var licenseKey = this.normalizeLicenseKey(this.$licenseKeyInput.val());

		if (licenseKey && !this.validateLicenseKey(licenseKey)) {
			return;
		}

		this.$updateLicenseSpinner.removeClass('hidden');

		var data = {
			licenseKey: licenseKey
		};

		Craft.postActionRequest('commerce/registration/updateLicenseKey', data, $.proxy(function(response, textStatus) {
			this.$updateLicenseSpinner.addClass('hidden');
			if (textStatus == 'success') {
				if (response.success) {
					this.setLicenseKey(response.licenseKey);
					this.setLicenseKeyStatus(response.licenseKeyStatus);
				} else {
					this.$licenseKeyError.text(response.error || Craft.t('An unknown error occurred.'));
				}
			}
		}, this));
	},

	handleTransferLicenseFormSubmit: function(ev) {
		ev.preventDefault();
		this.$transferLicenseSpinner.removeClass('hidden');
		Craft.postActionRequest('commerce/registration/transfer', $.proxy(function(response, textStatus) {
			this.$transferLicenseSpinner.addClass('hidden');
			if (textStatus == 'success') {
				this.setLicenseKey(response.licenseKey);
				this.setLicenseKeyStatus(response.licenseKeyStatus);
			}
		}, this));
	},

	handleLicenseKeyFocus: function() {
		this.$licenseKeyInput.get(0).setSelectionRange(0, this.$licenseKeyInput.val().length);
	},

	handleLicenseKeyTextChange: function() {
		this.$licenseKeyInput.removeClass('error');

		var licenseKey = this.normalizeLicenseKey(this.$licenseKeyInput.val());

		if (licenseKey) {
			this.$clearBtn.removeClass('hidden');
		} else {
			this.$clearBtn.addClass('hidden');
		}

		if (licenseKey != this.licenseKey && (!licenseKey || this.validateLicenseKey(licenseKey))) {
			this.$updateBtn.removeClass('disabled');
		} else {
			this.$updateBtn.addClass('disabled');
		}
	},

	handleClearButtonClick: function() {
		this.$licenseKeyInput.val('').focus();
		this.handleLicenseKeyTextChange();
	}
});

})(jQuery);