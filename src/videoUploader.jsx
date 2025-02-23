import React, { useState, useRef } from "react";
import axios from "axios";

function FileInputButton({ onFileChange }) {
	const fileInputRef = useRef(null);
	const [fileName, setFileName] = useState("Choose File");

	const handleButtonClick = () => {
		fileInputRef.current.click();
	};

	const handleFileChange = (event) => {
		const selectedFile = event.target.files[0];
		if (selectedFile) {
			setFileName(selectedFile.name);
			onFileChange(event);
		} else {
			setFileName("Choose File");
		}
	};

	return (
		<div className="relative w-full">
			<button
				type="button"
				onClick={handleButtonClick}
				className="w-full bg-gray-200 hover:bg-gray-300 text-white font-semibold py-2 px-4 rounded">
				{fileName}
			</button>
			<input
				ref={fileInputRef}
				type="file"
				accept="video/*"
				onChange={handleFileChange}
				className="absolute inset-0 opacity-0 cursor-pointer w-full text-white"
			/>
		</div>
	);
}

function VideoUploader() {
	const [selectedFile, setSelectedFile] = useState(null);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [uploadStatus, setUploadStatus] = useState("");
	const [videoUrl, setVideoUrl] = useState(null);
	const [videoKey, setVideoKey] = useState(null);
	const [jobId, setJobId] = useState(null);
	const [jobStatus, setJobStatus] = useState(null);
	const [conversionComplete, setConversionComplete] = useState(false);

	const handleFileChange = (event) => {
		setSelectedFile(event.target.files[0]);
	};

	const handleUpload = async () => {
		if (!selectedFile) {
			alert("Please select a file.");
			return;
		}

		const contentType = selectedFile.type;
		const filename = selectedFile.name;

		try {
			setUploadStatus("Generating signed URL...");
			const response = await axios.post("https://b911-154-192-45-67.ngrok-free.app/generate-signed-url", {
				filename,
				contentType,
			});
			console.log(response);
			const { signedUrl, key } = response.data;

			setUploadStatus("Uploading...");

			await axios
				.put(signedUrl, selectedFile, {
					headers: {
						"Content-Type": contentType,
					},
					onUploadProgress: (progressEvent) => {
						console.log(progressEvent);
						const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
						console.log(percentCompleted);
						setUploadProgress(percentCompleted);
					},
				})
				.then(() => {
					setVideoKey(key);
					setUploadStatus(`Upload successful! Video key: ${key}`);
					setUploadProgress(0);
					setSelectedFile(null);
					setUploadStatus("Triggering HLS conversion...");
					axios
						.post("https://b911-154-192-45-67.ngrok-free.app/trigger-hls-conversion", { key: key })
						.then((response) => {
							console.log(response);
							setJobId(response.data.jobId);
							setUploadStatus(`HLS conversion triggered: Job ID ${response.data.jobId}`);
						});
				});

			if (key) {
				try {
				} catch (error) {
					console.error("MediaConvert Error:", error);
					setUploadStatus("Failed to trigger HLS conversion.");
				}
			}
		} catch (error) {
			console.error("Upload error:", error);
			setUploadStatus(`Upload failed: ${error.message}`);
			setUploadProgress(0);
		}
	};

	const handleDownload = async () => {
		if (!videoKey) {
			alert("No video uploaded yet.");
			return;
		}

		try {
			const response = await axios.post("https://b911-154-192-45-67.ngrok-free.app/generate-download-url", {
				key: videoKey,
			});
			setVideoUrl(response.data.signedUrl);
		} catch (error) {
			console.error("Download error:", error);
			alert("Failed to generate download URL.");
		}
	};

	const handleCheckStatus = async () => {
		if (!jobId) {
			alert("No job ID available.");
			return;
		}

		try {
			const response = await axios.post("https://b911-154-192-45-67.ngrok-free.app/job-status", {
				jobId: jobId,
			});

			setJobStatus(JSON.stringify(response.data, null, 2));
			if (response.data.status === "COMPLETE") {
				setConversionComplete(true);
			} else {
				setConversionComplete(false);
			}
		} catch (error) {
			console.error("Status check error:", error);
			alert("Failed to check job status.");
		}
	};

	return (
		<div className="bg-gray-100 w-screen min-h-screen flex flex-col items-center justify-center">
			<div className="bg-white p-8 text-black rounded shadow-md w-full max-w-md flex flex-col items-center justify-center">
				<h2 className="text-2xl font-semibold mb-4">Video Uploader</h2>
				<FileInputButton onFileChange={handleFileChange} />
				<button
					onClick={handleUpload}
					className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full mt-4">
					Upload
				</button>
				{uploadProgress > 0 && (
					<div className="mt-4 w-full">
						<p>Upload Progress: {uploadProgress}%</p>
						<progress
							value={uploadProgress}
							max="100"
							className="w-full"></progress>
					</div>
				)}
				{uploadStatus && <p className="mt-4">{uploadStatus}</p>}
				{jobId && (
					<button
						onClick={handleCheckStatus}
						className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded mt-4 w-full">
						Check Job Status
					</button>
				)}
				{jobStatus && (
					<div className="mt-4 w-full">
						<pre className="bg-gray-200 p-4 rounded">{jobStatus}</pre>
					</div>
				)}
			</div>
			{conversionComplete && videoKey && (
				<button
					onClick={handleDownload}
					className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4 w-full max-w-md">
					Download/Play Video
				</button>
			)}
			{videoUrl && (
				<video
					controls
					src={videoUrl}
					className="mt-4 w-full max-w-screen-lg"
				/>
			)}
		</div>
	);
}

export default VideoUploader;
