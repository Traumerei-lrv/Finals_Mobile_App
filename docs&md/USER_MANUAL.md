# Example App User Manual

## 1. Overview

This sample role-based application is documented for three user groups:

- Job Seeker
- Recruiter
- Admin

The app allows users to sign in, access role-specific dashboards, and complete tasks related to job search, recruitment, and platform management.

## 2. User Roles

### 2.1 Job Seeker

Job seekers can:

- Sign in with email/password or Google
- Browse job opportunities
- View job details
- Save jobs
- Submit applications
- Track submitted applications
- Manage profile and resume settings

### 2.2 Recruiter

Recruiters can:

- Sign in to the recruiter dashboard
- Post job openings
- Review applicants
- Archive applications
- Schedule interviews
- Manage recruiter profile details

### 2.3 Admin

Admins can:

- Access the admin dashboard
- Manage jobs
- Manage applicants
- Manage users
- View reports
- Review audit logs
- Access recruiter-related management screens

## 3. Getting Started

### 3.1 Launching the App

Open the installed app on your device or run the project locally through Expo/EAS depending on your development setup.

### 3.2 Signing In

Users can sign in using:

- Email and password
- Google Sign-In

After login, the app routes users to the correct dashboard based on their stored Firebase role.

## 4. Job Seeker Guide

### 4.1 Home Dashboard

After signing in as a job seeker, the dashboard provides access to:

- Recommended jobs
- Search tools
- Saved jobs
- Application-related screens
- Profile actions

### 4.2 Searching for Jobs

Job seekers can browse and search for available jobs from the main dashboard and search-related screens.

Typical actions include:

- Opening a job card
- Viewing role details
- Checking company and job information

### 4.3 Viewing Job Details

From a job listing, users can open the full job details page to review:

- Job title
- Company
- Description
- Requirements
- Application-related actions

### 4.4 Saving Jobs

Users can save jobs for later review and revisit them from the saved jobs screen.

### 4.5 Submitting an Application

To apply for a job:

1. Open a job posting.
2. Tap the apply action.
3. Fill in the required details.
4. Add the requested resume link or supporting information.
5. Submit the application.

### 4.6 Tracking Applications

After submitting, job seekers can monitor application progress through the tracking screen.

### 4.7 Managing Profile

The profile area allows job seekers to:

- Review profile information
- Edit profile details
- Access resume settings
- Open privacy settings
- Sign out

## 5. Recruiter Guide

### 5.1 Recruiter Dashboard

Recruiters are directed to a dashboard that supports hiring workflows and applicant review.

### 5.2 Posting a Job

The app includes a multi-step posting flow for recruiters:

1. Start a new job post.
2. Fill in job information.
3. Continue through the next posting steps.
4. Submit and confirm the posting.

### 5.3 Reviewing Applicants

Recruiters can view incoming applicants for posted jobs and inspect candidate details through the applicant review flow.

### 5.4 Archiving Applications

Applications that are no longer active can be moved into archived views for recordkeeping.

### 5.5 Scheduling Interviews

Recruiters can schedule interviews and store scheduling details for applicants inside the app.

### 5.6 Managing Recruiter Profile

Recruiters can open their profile screen and update profile information when needed.

## 6. Admin Guide

### 6.1 Admin Dashboard

Admins have access to administrative tools for maintaining the platform.

### 6.2 Managing Jobs

Admins can review and manage job postings available in the system.

### 6.3 Managing Applicants

Admins can inspect applicant data and monitor application activity.

### 6.4 Managing Users

Admins can review platform users and support role-based oversight.

### 6.5 Reports and Audit Logs

Admins can:

- Open reports
- Review audit logs
- Monitor administrative actions and system activity

## 7. Authentication Notes

### 7.1 Email and Password Login

Email/password users must enter valid credentials registered in Firebase Authentication.

### 7.2 Google Sign-In

Google Sign-In depends on:

- Correct Firebase configuration
- Matching OAuth client IDs
- A supported Android or native build when testing mobile sign-in

If Google Sign-In fails, verify that the installed build is up to date and linked to the correct Firebase project.

## 8. Troubleshooting

### 8.1 Wrong Dashboard After Login

If a user lands on the wrong dashboard:

- Check the user document in Firebase
- Verify the role field
- Confirm the app is pointed to the correct Firebase project

### 8.2 Google Sign-In Issues

If Google Sign-In does not work:

- Confirm the correct Android, iOS, and Web OAuth client IDs are configured
- Confirm the app build was rebuilt after auth changes
- Confirm Firebase Authentication has Google enabled

### 8.3 Deactivated Account

If a signed-in account is marked inactive in the database, the app may immediately sign the user out and block access.

## 9. Best Practices

- Keep account role data accurate in Firebase
- Rebuild the app after changing native Google Sign-In settings
- Use role-appropriate accounts during testing
- Review profile and application data before submitting

## 10. Document Purpose

This manual is intended to give teammates, testers, and stakeholders a structured reference for how users interact with the sample app.
